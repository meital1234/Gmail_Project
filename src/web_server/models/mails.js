let idCounter = 0;
const mails = []; // array to store all users in memory.


const getLatestMailsForUser = (userEmail) => {
  return mails
    .filter(m => m.to === userEmail || m.from === userEmail)
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50);
}


const createMail = ({ from, to, subject, content, dateSent }) => {
  const mail = {
      id: ++idCounter,
      from,
      to,
      subject,
      content,
      dateSent
  };
  // Adds mail to the array and than returns him.
  mails.push(mail);
  return mail;
}


const getMailById = (id) => mails.find(u => u.id === id);


module.exports = {
  createMail,
  getLatestMailsForUser,
  getMailById
};
