const Labels =require('../models/labels')

let idCounter = 0;
const mails = []; // array to store all users in memory.


const getLatestMailsForUser = (userId) => {
  return mails
    .filter(m => m.senderId === userId || m.recieverId === userId)
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
}


const createMail = ({ from, to, senderId, recieverId, subject, content, labelIds, dateSent }) => {
  const mail = {
      id: ++idCounter,
      from,
      to,
      senderId, 
      recieverId,
      subject,
      content,
      labelIds: labelIds || [],  // default is empty if none
      dateSent
  };
  // Adds mail to the array and than returns mail.
  mails.push(mail);
  return mail;
}


const getMailById = ({ id, userId }) => {
  const mail = mails.find(m => m.id === id && (m.senderId === userId || m.recieverId === userId));
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

  if (updates.subject !== undefined) {
    mail.subject = updates.subject;
  }
  if (updates.content !== undefined) {
    mail.content = updates.content;
  }
  if (updates.labels !== undefined) {
    mail.labels = updates.labels;
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

// search through all mail subjects for any mail that contain the query
function searchMails(query, userId) {
  const q = query.trim().toLowerCase();

  return mails.filter(mail => {
    // match only if user has access
    if (mail.senderId !== userId && mail.recieverId !== userId) return false;

    const subjectMatch = mail.subject?.toLowerCase().includes(q);
    const contentMatch = mail.content?.toLowerCase().includes(q);
    const fromMatch = mail.from?.toLowerCase().includes(q);
    const toMatch = mail.to?.toLowerCase().includes(q);

    const labelNames = (mail.labelIds || [])
      .map(id => {
        const label = Labels.getLabelById({id, userId});
        return label?.name?.toLowerCase();
      })
      .filter(Boolean);

    const labelMatch = labelNames.some(name => name.includes(q));

    return subjectMatch || contentMatch || fromMatch || toMatch || labelMatch;
  });
}

module.exports = {
  createMail,
  getLatestMailsForUser,
  getMailById,
  updateMailById,
  deleteMailById,
  searchMails
};
