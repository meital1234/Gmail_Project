const Users = require('../models/users');   // needed to identify the sender and receiver id by token
const Mail = require('../models/mails');
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed
const { extractLinks } = require('../utils/links');
const { checkLinksWithTCP } = require('../utils/tcpClient');


exports.getInbox = (req, res) => {
  // make sure user id is passed by header and is an actual user
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const inbox = Mail.getLatestMailsForUser(sender.id);
  res.json(inbox);
}

exports.sendMail = async (req, res) => {
  // ---------------- input checks ----------------
  // make sure user id is passed by header and is an actual user
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const { toEmail, subject, content, labels, cc } = req.body;
  // Checks that all required fields are present - in this case only the target email
  if (!toEmail) {
    return res.status(400).json({ error: 'Receiver email is required' });
  }

  // verify the recipient email
  const recipient = Users.getUserByEmail(toEmail);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }

  // extract all links in the mail for blacklist check
  const links = extractLinks(content);
  const hasBlacklisted = await checkLinksWithTCP(links);
  if (hasBlacklisted) {
    return res.status(400).json({ error: 'Mail contains malicious links' });
  }

  // Creates and send the new mail, return the id as a response
  const newMail = Mail.createMail({
    from: sender.id,
    to: recipient.id,
    subject,
    content,
    cc,
    labels: labels || [],
    dateSent: new Date(),
  });
  res.status(201).json({ id: newMail.id });
}

exports.getMailById = (req, res) => {
  const id = parseInt(req.params.id); // Gets the id from the path and converts it to a number.
  const mail = Mail.getMailById(id); // Searching for the mail in the model.
  
  // If the user is not found we will return 404.
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  const { from, to, subject, content, cc, labels, dateSent } = mail;
  res.json({ id, from, to, subject, content, cc, labels, dateSent }); // Returns the mail data
};

exports.editMailById = (req, res) => {

}

exports.deleteMailById = (req, res) => {

}