let idCounter = 0;
const mails = []; // array to store all users in memory.


const getLatestMailsForUser = (userId) => {
  return mails
    .filter(m => m.senderId === userId || m.recieverId === userId)
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50);
}


const createMail = ({ from, to, senderId, recieverId, subject, content, dateSent }) => {
  const mail = {
      id: ++idCounter,
      from,
      to,
      senderId, 
      recieverId,
      subject,
      content,
      dateSent
  };
  // Adds mail to the array and than returns him.
  mails.push(mail);
  return mail;
}


const getMailById = (id) => mails.find(u => u.id === id);


function updateMailById(mailId, updates) {
  const mail = mails.find(m => m.id === mailId);
  if (!mail) return false;

  if (updates.subject !== undefined) {
    mail.subject = updates.subject;
  }
  if (updates.content !== undefined) {
    mail.content = updates.content;
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
function searchMails(query) {
  const q = query.toLowerCase();
  return mails.filter(m =>
    typeof m.subject === 'string' &&
    m.subject.toLowerCase().includes(q)
  );
}

module.exports = {
  createMail,
  getLatestMailsForUser,
  getMailById,
  updateMailById,
  deleteMailById,
  searchMails
};