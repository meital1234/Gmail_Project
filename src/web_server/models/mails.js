let idCounter = 0;
const mails = []; // array to store all users in memory.

const createMail = ({ from, to, subject, content, cc, labels, dateSent }) => {
    const mail = {
        id: ++idCounter,
        from,
        to,
        subject,
        content,
        cc,
        labels,
        dateSent
    };
    // Adds mail to the array and than returns him.
    mails.push(mail);
    return mail;
}

const getLatestMailsForUser = (userId) => {
  return mails
    .filter(m => m.to === userId || m.from === userId)
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50);
}

const getMailById = (id) => mails.find(u => u.id === id);


module.exports = {
  createMail,
  getLatestMailsForUser,
  getMailById
};
