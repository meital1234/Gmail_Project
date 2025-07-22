const Labels =require('../models/labels')
const Blacklist = require('../models/blacklist');


let idCounter = 0;
const mails = []; // array to store all users in memory.

// helper function to deal with adding the spam label to a mail
function _attachSpamLabel(mail, userId) {
  // assume this exists - Labels.getLabelByName({ name, userId })
  const spamLbl = Labels.getLabelByName({ name: 'spam', userId });
  if (spamLbl && !mail.labelIds.includes(spamLbl.id)) {
    mail.labelIds.push(spamLbl.id);
  }
}

const getLatestMailsForUser = (userId) => {
  return mails
    .filter(m => {
      const isSender = m.senderId === userId;
      const isRecipient = m.receiverId === userId;

      const labelNames = (m.labelIds || []).map(id => {
        const label = Labels.getLabelById({ id, userId: m.senderId });
        return label?.name?.toLowerCase();
      });

      const isDraft = labelNames.includes("drafts");

      // If it's a Draft — return only if the user is in the sender (and not in the Inbox).
      if (isDraft) {
        return isSender;  // Only the sender sees their draft.
      }

      // Otherwise, Regular Email: If the user is the sender or recipient.
      return isSender || isRecipient;
    })
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50)
    .map(m => {
      const labelObjs = (m.labelIds || [])
        .map(id => Labels.getLabelById({ id, userId }))
        .filter(label => label)
        .map(({ id, name }) => ({ id, name }));

      return {
        ...m,
        labels: labelObjs
      };
    });
};

async function createMail ({ from, to, senderId, receiverId, subject, content, labelIds, dateSent }) {
  const mail = {
      id: ++idCounter,
      from,
      to,
      senderId, 
      receiverId,
      subject,
      content,
      labelIds: labelIds || [],  // default is empty if none
      dateSent,
      hiddenFrom: []
  };

  // automatic sends to spam if URL is bad
  const links = Array.from(content.matchAll(/((https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}(\/\S*)?)/gi), m => m[0]);
  for (const link of links) {
    if (await Blacklist.isBlacklisted(link)) {
      mail.isSpam = true;
      _attachSpamLabel(mail, senderId);
      _attachSpamLabel(mail, receiverId);
      break;
    }
  }

  // Adds mail to the array and than returns mail.
  mails.push(mail);
  return mail;
}


const getMailById = ({ id, userId }) => {
  const mail = mails.find(m => m.id === id && (m.senderId === userId || m.receiverId === userId)  &&
  !(m.hiddenFrom?.includes(userId)));
  if (!mail) return null;

  const labelObjs = (mail.labelIds || [])
    .map(id => Labels.getLabelById({id, userId}))
    .filter(label => label)
    .map(({ id, name }) => ({ id, name }));

  return {
    ...mail,
    labels: labelObjs
  };
};


function updateMailById(mailId, updates) {
  const mail = mails.find(m => m.id === mailId);
  if (!mail) return false;

  if (updates.to !== undefined) {
    mail.to = updates.to;
  }

  if (updates.subject !== undefined) {
    mail.subject = updates.subject;
  }
  if (updates.content !== undefined) {
    mail.content = updates.content;
  }
  if (updates.labels !== undefined) {
    mail.labelIds = updates.labels;
  }
  return true;
}


function deleteMailById(mailId) {
  // find the mail's index in the mails array
  const index = mails.findIndex(m => m.id === mailId);
  if (index === -1) return null;

  // preform safe delete
  const deleted = mails.splice(index, 1)[0];
  return deleted;
}

function deleteMailByIdForUser(mailId, userId) {
  const mail = mails.find(m => m.id === mailId);
  if (!mail) return false;

  mail.hiddenFrom = [...new Set([...(mail.hiddenFrom), userId])];
  return true;
};

// search through all mail subjects for any mail that contain the query
function searchMails(query, userId) {
  const q = query.trim().toLowerCase();

  return mails.filter(mail => {
    // match only if user has access
    if (mail.senderId !== userId && mail.receiverId !== userId && !(mail.hiddenFrom?.includes(userId)) ) return false;

    // check if the mail is in the drafts of the sender
    const labelNamesOfSender = (mail.labelIds || [])
      .map(id => {
        const label = Labels.getLabelById({ id, userId: mail.senderId });
        return label?.name?.toLowerCase();
      })
      .filter(Boolean);
    const isSender = mail.senderId === userId;
    const isDraft = labelNamesOfSender.includes("drafts");
    if (!isSender && isDraft) return false; // if it is don't return it

    const subjectMatch = mail.subject?.toLowerCase().includes(q);
    const contentMatch = mail.content?.toLowerCase().includes(q);
    const fromMatch = mail.from?.toLowerCase().includes(q);
    const toMatch = mail.to?.toLowerCase().includes(q);

    const labelNames = (mail.labelIds || [])
      .map(id => {
        const label = Labels.getLabelById({id, userId});
        return label?.name?.toLowerCase();
      }).filter(Boolean);
    
    const labelMatch = labelNames.some(name => name.includes(q));

    return subjectMatch || contentMatch || fromMatch || toMatch || labelMatch;
  });
}

// this function loads the spam folder
// function getSpamMailsForUser(userId) {
//   return mails
//     .filter(m => m.isSpam && (m.senderId === userId || m.receiverId === userId))
//     .sort((a, b) => b.dateSent - a.dateSent);
// }

async function markMailAsSpamById(mailId) {
  const mail = mails.find(m => m.id === mailId);
  if (!mail) return false;
  mail.isSpam = true;

  _attachSpamLabel(mail, mail.senderId);
  _attachSpamLabel(mail, mail.receiverId);

  const links = Array.from(mail.content.matchAll(/https?:\/\/[^\s]+/g), m => m[0]);
  for (const link of links) {
    // if still not in blacklist
    if (!await Blacklist.isBlacklisted(link)) {
      await Blacklist.addUrl(link);
    }
  }

  return true;
}

module.exports = {
  createMail,
  getLatestMailsForUser,
  getMailById,
  updateMailById,
  deleteMailById,
  deleteMailByIdForUser,
  searchMails,
  markMailAsSpamById
};
