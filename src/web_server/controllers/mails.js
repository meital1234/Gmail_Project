/*
 * Mail Controller
 * ---------------
 * Validates requests, calls service layer, formats response for API.
 */

const Users      = require('../services/users');
const Mail       = require('../services/mails');
const Labels     = require('../services/labels');
const Blacklist  = require('../services/blacklist');
const { getAuthenticatedUser } = require('../utils/auth');
const { extractLinks } = require('../utils/linkExtraction');
const { checkLinks }  = require('../utils/TCPclient');

/**
 * GET /api/mails
 * Returns the latest 50 mails visible to the current user.
 */
exports.getInbox = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const inbox = await Mail.getLatestMailsForUser(user._id);
  const filteredInbox = inbox.map(
    ({ mailId, from, to, subject, content, dateSent, labels }) => ({
      id: mailId,
      from,
      to,
      subject,
      content,
      dateSent,
      labels
    })
  );
  res.json(filteredInbox);
};

/**
 * POST /api/mails
 * Composes and sends (or drafts) a new mail.
 * Handles validation, resolves recipient, maps label names to ObjectIds, auto-adds Sent/Inbox labels.
 * Returns mail id and spam flag.
 */
exports.sendMail = async (req, res) => {
  const sender = await getAuthenticatedUser(req, res);
  if (!sender) return;

  try {
    const {
      receiverId,
      toEmail,
      subject,
      content,
      labels = []
    } = req.body;

    // Determine if mail is a draft
    const isDraft = labels.map(l => l.toLowerCase()).includes('drafts');

    // Find receiver if only email is provided
    let finalReceiverId = receiverId;
    if (!isDraft && !finalReceiverId && toEmail) {
      const rec = await Users.getUserByEmail(toEmail);
      if (!rec)
        return res.status(404).json({ error: 'Recipient not found' });
      finalReceiverId = rec._id;
    }

    // Must have recipient if not a draft
    if (!isDraft && !finalReceiverId) {
      return res
        .status(400)
        .json({ error: 'receiverId or toEmail is required' });
    }

    // Map label names to ObjectIds for the sender
    const senderLabels = await Labels.getAllLabelsByUser(sender._id);
    const labelObjects = labels.map(name =>
      senderLabels.find(l => l.name.toLowerCase() === name.toLowerCase())
    );
    if (labelObjects.includes(undefined)) {
      return res.status(400).json({ error: 'One or more labels do not exist' });
    }
    const labelIds = labelObjects.map(l => l._id);

    // Auto-add Sent (for sender) and Inbox (for receiver) labels if not a draft
    if (!isDraft) {
      const sentLbl = senderLabels.find(l => l.name.toLowerCase() === 'sent');
      if (sentLbl && !labelIds.includes(sentLbl._id)) labelIds.push(sentLbl._id);

      if (finalReceiverId) {
        const recLabels = await Labels.getAllLabelsByUser(finalReceiverId);
        const inboxLbl  = recLabels.find(l => l.name.toLowerCase() === 'inbox');
        if (inboxLbl) labelIds.push(inboxLbl._id);
      }
    }

    // Create mail via service
    const newMail = await Mail.createMail({
      from: sender.email,
      to: toEmail,
      senderId: sender._id,
      receiverId: finalReceiverId,
      subject,
      content,
      labelIds,
      dateSent: new Date()
    });

    // 200 if spam, 201 otherwise
    const statusCode = newMail.isSpam ? 200 : 201;
    return res
      .status(statusCode)
      .location(`/api/mails/${newMail.mailId}`)
      .json({ id: newMail.mailId, isSpam: newMail.isSpam });

  } catch (err) {
    // Prevents crash if mail couldn't be created (e.g., discard with missing fields)
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * GET /api/mails/:id
 * Returns a single mail by its mailId, if the user is authorized to see it.
 * Blocks reading someone else's draft.
 */
exports.getMailById = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  // Expect mailId to be a number (not MongoDB ObjectId)
  const id = Number(req.params.id);
  if (Number.isNaN(id))
    return res.status(400).json({ error: 'Invalid mail ID' });

  const mail = await Mail.getMailById({ id, userId: user._id });
  if (!mail) return res.status(404).json({ error: 'Mail not found' });

  // Only sender can read draft mails
  const draftLabel = await Labels.getLabelByName({ name: 'drafts', userId: mail.senderId });
  const isDraft = mail.labelIds?.some(lid =>
    lid.toString() === draftLabel?._id?.toString()
  );
  if (!user._id.equals(mail.senderId) && isDraft)
    return res.status(403).json({ error: 'Mail is still a draft' });

  const { from, to, subject, content, labels, dateSent } = mail;
  res.json({
    id,
    from,
    to,
    subject,
    content,
    dateSent,
    labels: labels.map(({ id: lId, name }) => ({ id: lId, name }))
  });
};

/**
 * PATCH /api/mails/:id
 * Edits a draft mail (only sender can do this).
 * Blocks edit for non-drafts or for non-senders.
 * Checks for malicious links.
 */
exports.editMailById = async (req, res) => {
  const sender = await getAuthenticatedUser(req, res);
  if (!sender) return;

  const mailId = Number(req.params.id);
  const mail   = await Mail.getMailById({ id: mailId, userId: sender._id });
  if (!mail) return res.status(404).json({ error: 'Mail not found' });

  if (!mail.senderId.equals(sender._id))
    return res.status(403).json({ error: 'Not authorized to edit this mail' });

  // --- FIX: Always compare labelIds as strings/ObjectId, not by name ---
  const draftLabel = await Labels.getLabelByName({ name: 'drafts', userId: sender._id });
  const hasDraftLabel = mail.labelIds?.some(lid =>
    lid.toString() === draftLabel?._id?.toString()
  );
  if (!hasDraftLabel)
    return res.status(403).json({ error: 'Only draft mails can be edited' });

  // Accept PATCH body with label names (["Drafts"]) or ObjectIds
  let { toEmail, subject, content, labels } = req.body;

  // If labels are names, map to ObjectIds
  let labelIds = undefined;
  if (labels && labels.length > 0) {
    const allLabels = await Labels.getAllLabelsByUser(sender._id);
    labelIds = labels.map(lab => {
      // Accept both ObjectId and string name
      const match =
        allLabels.find(l => l._id.toString() === lab) ||
        allLabels.find(l => l.name.toLowerCase() === lab.toLowerCase());
      if (!match)
        throw new Error('One or more labels do not exist');
      return match._id;
    });
  }

  // Allow updating any fields (even to empty string) -- only check if at least one field is different
  const nothingToUpdate =
    (toEmail === undefined || toEmail === mail.to) &&
    (subject === undefined || subject === mail.subject) &&
    (content === undefined || content === mail.content) &&
    (!labelIds || (labelIds.length === (mail.labelIds || []).length &&
      labelIds.every((lid, i) => lid.toString() === mail.labelIds[i].toString()))
    );
  if (nothingToUpdate) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // Full link-spam check before editing mail (optional for drafts; only if fields present)
  const textToCheck = [subject, content].filter(Boolean).join(' ');
  if (textToCheck) {
    const links = extractLinks(textToCheck);
    const hasBlacklisted = await checkLinks(links);
    if (hasBlacklisted)
      return res.status(400).json({ error: 'Mail contains malicious links' });
  }

  // Update the mail by mailId!
  await Mail.updateMailById(mailId, {
    to: toEmail,
    subject,
    content,
    labels: labelIds
  });

  res.sendStatus(204);
};

/**
 * DELETE /api/mails/:id
 * Deletes a mail. Only sender can delete.
 * If mail is a draft, delete permanently. Otherwise, only "hide" it (soft delete).
 */
exports.deleteMailById = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const mailId = Number(req.params.id);
  const mail   = await Mail.getMailById({ id: mailId, userId: user._id });
  if (!mail) return res.status(404).json({ error: 'Mail not found' });

  if (!mail.senderId.equals(user._id))
    return res.status(403).json({ error: 'Not authorized to delete this mail' });

  const draftLabel = await Labels.getLabelByName({ name: 'drafts', userId: user._id });
  const hasDraftLabel = mail.labelIds?.some(lid =>
    lid.toString() === draftLabel?._id?.toString()
  );

  if (!hasDraftLabel) {
    const success = await Mail.deleteMailByIdForUser(mailId, user._id);
    if (!success) return res.status(500).json({ error: 'Could not hide mail' });
    return res.sendStatus(204);
  }

  await Mail.deleteMailById(mailId);
  res.sendStatus(204);
};

/**
 * GET /api/mails/search/:query
 * Search for mails by text (subject/content) for current user.
 * Always returns the latest 50 matches, with their labels.
 */
exports.searchMails = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const { query } = req.params;
  const matched = await Mail.searchMails(query, user._id);
  const latest50 = matched.sort((a, b) => b.dateSent - a.dateSent).slice(0, 50);

  const payload = await Promise.all(
    latest50.map(async mail => {
      const filteredLabels = (
        await Promise.all(
          (mail.labelIds || []).map(id =>
            Labels.getLabelById({ id, userId: user._id })
          )
        )
      )
        .filter(Boolean)
        .map(({ _id, name }) => ({ id: _id, name }));
      return {
        id: mail.mailId,
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        content: mail.content,
        dateSent: mail.dateSent,
        labels: filteredLabels
      };
    })
  );
  res.json(payload);
};

/*
 * Fetch all mails for the current user that are tagged with a specific label.
 * Used for sidebar label view (e.g. show all mails in "Work" label).
 * Route: GET /api/mails/label/:labelId
 */
exports.getMailsByLabel = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const { labelId } = req.params;
  if (!labelId) return res.status(400).json({ error: 'labelId is required' });

  // Find all mails (sent or received) by the user that have the labelId in their labelIds array
  const mails = await Mail.getMailsByLabel(labelId, user._id);

  // Standardize the payload
  const payload = mails.map(mail => ({
    id: mail.mailId,
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    content: mail.content,
    dateSent: mail.dateSent,
    labels: mail.labels || [] // Already populated by the service
  }));

  res.json(payload);
};

// Add a label to a mail (POST /api/mails/:mailId/labels/:labelId)
exports.addLabelToMail = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  const { mailId, labelId } = req.params;
  try {
    const updated = await Mail.addLabelToMail(mailId, labelId, user._id);
    return res.status(200).json({ success: true, mail: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Remove a label from a mail (DELETE /api/mails/:mailId/labels/:labelId)
exports.removeLabelFromMail = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  const { mailId, labelId } = req.params;
  try {
    const updated = await Mail.removeLabelFromMail(mailId, labelId, user._id);
    return res.status(200).json({ success: true, mail: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
