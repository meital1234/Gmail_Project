const mongoose         = require('mongoose');
const Mail             = require('../models/mails');
const labelService     = require('./labels');
const blacklistService = require('./blacklist');
const { extractLinks } = require('../utils/linkExtraction');

/**
 * Generates the next sequential mailId for legacy compatibility.
 */
async function getNextMailId() {
  const counters = mongoose.connection.collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: 'mailId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return result.seq;
}

/**
 * Fetches the latest 50 mails for a given user (sent or received, not hidden).
 */
async function getLatestMailsForUser(userId) {
  if (!userId) throw new Error('userId is required');
  const u = new mongoose.Types.ObjectId(userId);

  const docs = await Mail.find({
    $and: [
      { $or: [{ senderId: u }, { receiverId: u }] },
      { hiddenFrom: { $ne: u } }
    ]
  }).sort({ dateSent: -1 }).limit(50).lean();

  return Promise.all(docs.map(async mail => {
    const labels = await Promise.all(
      (mail.labelIds || []).map(id =>
        labelService.getLabelById({ id, userId: u })
      )
    );
    return {
      ...mail,
      labels: labels.filter(Boolean).map(l => ({ id: l._id, name: l.name }))
    };
  }));
}

/**
 * Creates and saves a mail (sent or draft).
 * Drafts: allow empty fields as long as at least one of (to, subject, content) is non-empty.
 * Sent mail: must have recipient (to), others can be empty.
 */
async function createMail(data) {
  const {
    from,
    to,
    senderId,
    receiverId,
    subject,
    content,
    labelIds = [],
    dateSent = new Date()
  } = data;

  // Detect if this mail is a draft (has the 'drafts' label)
  let isDraft = false;
  if (labelIds && labelIds.length > 0) {
    for (const lid of labelIds) {
      const lbl = await labelService.getLabelById({ id: lid, userId: senderId });
      if (lbl && lbl.name.toLowerCase() === 'drafts') {
        isDraft = true;
        break;
      }
    }
  }

  // Draft: allow saving if at least one of (to, subject, content) has a non-empty value
  if (isDraft) {
    const anyFieldFilled =
      (typeof to === 'string' && to.trim().length > 0) ||
      (typeof subject === 'string' && subject.trim().length > 0) ||
      (typeof content === 'string' && content.trim().length > 0);

    if (!anyFieldFilled) {
      throw new Error('Cannot save draft with all fields empty');
    }
    if (!from || !senderId) {
      throw new Error('from and senderId are required for draft');
    }
  } else {
    if (!to) {
      throw new Error('receiverId (to) is required to send mail');
    }
    if (!from || !senderId) {
      throw new Error('from and senderId are required');
    }
    // subject/content can be empty
  }

  // Assign next mailId
  const mailId = await getNextMailId();

  const mail = new Mail({
    mailId,
    from,
    to,
    senderId,
    receiverId,
    subject,
    content,
    labelIds,
    dateSent
  });

  // Only check for spam on sent mails (not drafts)
  if (!isDraft && typeof content === 'string' && content.length > 0) {
    const links = extractLinks(content);
    for (const url of links) {
      if (await blacklistService.isBlacklisted(url)) {
        mail.isSpam = true;
        for (const uid of [senderId, receiverId]) {
          const spamLbl = await labelService.getLabelByName({ name: 'spam', userId: uid });
          if (spamLbl && !mail.labelIds.includes(spamLbl._id)) {
            mail.labelIds.push(spamLbl._id);
          }
        }
        break;
      }
    }
  }

  await mail.save();
  return mail.toObject();
}

/**
 * Fetch a single mail by its mailId, ensures user is sender/receiver and mail is not hidden.
 */
async function getMailById({ id, userId }) {
  if (!id || !userId) throw new Error('id and userId required');
  const u = new mongoose.Types.ObjectId(userId);

  const mail = await Mail.findOne({
    mailId: Number(id),
    $or: [{ senderId: u }, { receiverId: u }],
    hiddenFrom: { $ne: u }
  }).lean();

  if (!mail) return null;

  const labels = await Promise.all(
    (mail.labelIds || []).map(lid =>
      labelService.getLabelById({ id: lid, userId })
    )
  );

  return {
    ...mail,
    labels: labels.filter(Boolean).map(l => ({ id: l._id, name: l.name }))
  };
}

/**
 * Update mail by mailId (not MongoDB _id!)
 * Updates subject, content, labels, and to.
 */
async function updateMailById(mailId, updates = {}) {
  if (!mailId) throw new Error('Mail id is required');
  const ops = {};
  if (updates.subject !== undefined) ops.subject = updates.subject;
  if (updates.content !== undefined) ops.content = updates.content;
  if (updates.labels !== undefined) ops.labelIds = updates.labels;
  if (updates.to !== undefined) ops.to = updates.to;

  const updated = await Mail.findOneAndUpdate(
    { mailId: Number(mailId) },
    { $set: ops },
    { new: true }
  ).lean();

  if (!updated) return null;

  const labels = await Promise.all(
    (updated.labelIds || []).map(lid =>
      labelService.getLabelById({ id: lid, userId: updated.senderId })
    )
  );

  return {
    ...updated,
    labels: labels.filter(Boolean).map(l => ({ id: l._id, name: l.name }))
  };
}

/**
 * Hard-delete a mail by its mailId (not _id!).
 */
async function deleteMailById(mailId) {
  if (!mailId) throw new Error('Mail id is required');
  return Mail.findOneAndDelete({ mailId: Number(mailId) }).lean();
}

/**
 * Soft-delete a mail for a specific user (adds userId to hiddenFrom).
 */
async function deleteMailByIdForUser(mailId, userId) {
  if (!mailId || !userId) throw new Error('Mail id and userId required');
  const u = new mongoose.Types.ObjectId(userId);
  return Mail.findOneAndUpdate(
    { mailId: Number(mailId) },
    { $addToSet: { hiddenFrom: u } },
    { new: true }
  ).lean();
}

/**
 * Simple full-text search over subject/content for a user's mails.
 */
async function searchMails(query, userId) {
  if (!userId) throw new Error('userId is required');
  const u = new mongoose.Types.ObjectId(userId);
  const q = (query || '').trim();
  if (!q) return [];

  const docs = await Mail.find({
    $and: [
      { $or: [{ senderId: u }, { receiverId: u }] },
      { hiddenFrom: { $ne: u } },
      { $or: [
        { subject: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ]}
    ]
  }).lean();

  return Promise.all(docs.map(async mail => {
    const labels = await Promise.all(
      (mail.labelIds || []).map(lid =>
        labelService.getLabelById({ id: lid, userId })
      )
    );
    return {
      ...mail,
      labels: labels.filter(Boolean).map(l => ({ id: l._id, name: l.name }))
    };
  }));
}

/**
 * Explicitly mark a mail as spam.
 */
async function markMailAsSpamById(mailId) {
  if (!mailId) throw new Error('Mail id is required');
  return Mail.findOneAndUpdate({ mailId: Number(mailId) }, { isSpam: true }).lean();
}

/**
 * Fetch all mails for user that have a specific labelId (for sidebar label view).
 */
async function getMailsByLabel(labelId, userId) {
  if (!labelId || !userId) throw new Error('labelId and userId are required');
  const u = new mongoose.Types.ObjectId(userId);

  const docs = await Mail.find({
    labelIds: new mongoose.Types.ObjectId(labelId),
    $or: [{ senderId: u }, { receiverId: u }],
    hiddenFrom: { $ne: u }
  })
    .sort({ dateSent: -1 })
    .lean();

  return Promise.all(
    docs.map(async mail => {
      const labels = await Promise.all(
        (mail.labelIds || []).map(lid =>
          labelService.getLabelById({ id: lid, userId: u })
        )
      );
      return {
        ...mail,
        labels: labels.filter(Boolean).map(l => ({ id: l._id, name: l.name }))
      };
    })
  );
}

/**
 * Adds a label to a mail, only if the label is not already present.
 */
// async function addLabelToMail(mailId, labelId, userId) {
//   if (!mailId || !labelId || !userId) throw new Error('mailId, labelId, userId are required');
//   const u = new mongoose.Types.ObjectId(userId);
//   const mail = await Mail.findOne({
//     mailId: Number(mailId),
//     $or: [{ senderId: u }, { receiverId: u }],
//     hiddenFrom: { $ne: u }
//   });
//   if (!mail) throw new Error('Mail not found or not authorized');
//   if (!mail.labelIds.some(id => id.equals(labelId))) {
//     mail.labelIds.push(labelId);
//     await mail.save();
//   }
//   return mail.toObject();
// }
async function addLabelToMail(mailId, labelId, userId) {
  if (!mailId || !labelId || !userId) throw new Error('mailId, labelId, userId are required');
  const u = new mongoose.Types.ObjectId(userId);

  const mail = await Mail.findOne({
    mailId: Number(mailId),
    $or: [{ senderId: u }, { receiverId: u }],
    hiddenFrom: { $ne: u }
  });
  if (!mail) throw new Error('Mail not found or not authorized');

  // הוסף את התווית אם לא קיימת
  if (!mail.labelIds.some(id => id.equals(labelId))) {
    mail.labelIds.push(labelId);
    await mail.save();
  }

  // אם התווית היא Spam – הוסף את קישורי המייל ל-blacklist וסמן isSpam
  const label = await labelService.getLabelById({ id: labelId, userId });
  if (label && label.name && label.name.toLowerCase() === 'spam') {
    const text  = [mail.subject, mail.content].filter(Boolean).join(' ');
    const links = extractLinks(text);

    // (לא חובה) לוג לדיבוג:
    // console.log('[Spam mark] links to blacklist:', links);

    for (const url of links) {
      try {
        await blacklistService.addUrl(url);   // מכניס ל-blacklist
      } catch (e) {
        console.warn('[addLabelToMail] failed adding URL:', url, e.message);
      }
    }

    if (!mail.isSpam) {
      mail.isSpam = true;
      await mail.save();
    }
  }

  return mail.toObject();
}

/**
 * Removes a label from a mail.
 */
async function removeLabelFromMail(mailId, labelId, userId) {
  if (!mailId || !labelId || !userId) throw new Error('mailId, labelId, userId are required');
  const u = new mongoose.Types.ObjectId(userId);
  const mail = await Mail.findOne({
    mailId: Number(mailId),
    $or: [{ senderId: u }, { receiverId: u }],
    hiddenFrom: { $ne: u }
  });
  if (!mail) throw new Error('Mail not found or not authorized');
  mail.labelIds = mail.labelIds.filter(id => !id.equals(labelId));
  await mail.save();
  return mail.toObject();
}

module.exports = {
  getLatestMailsForUser,
  createMail,
  getMailById,
  updateMailById,
  deleteMailById,
  deleteMailByIdForUser,
  searchMails,
  markMailAsSpamById,
  getMailsByLabel,
  addLabelToMail,
  removeLabelFromMail
};
