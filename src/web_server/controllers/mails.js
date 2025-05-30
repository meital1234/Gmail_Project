const Users = require('../models/users');   // needed to identify the sender and receiver id by token
const Mail = require('../models/mails');
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed
const { extractLinks } = require('../utils/linkExtraction');
const { checkLinksWithTCP } = require('../utils/TCPclientconnection');
const send = require('send');


exports.getInbox = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const inbox = Mail.getLatestMailsForUser(sender.id);
  const {from, to, subject, content, dateSent} = inbox
  res.json({from, to, subject, content, dateSent});
};

exports.sendMail = async (req, res) => {
  // ---------------- input checks ----------------
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const { toEmail, subject, content } = req.body;
  // Checks that all required fields are present - in this case only the target email
  if (!toEmail) {
    return res.status(400).json({ error: 'Receiver email is required' });
  }

  // TODO: pass multiple recipients as an array??
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
    from: sender.email,
    to: toEmail,
    senderId: sender.id,
    recieverId: recipient.id,
    subject,
    content,
    dateSent: new Date(),
  });
  // TODO: move the new mail id to location
  res.status(201).location(`/api/mails/${newMail.id}`).send();
};

exports.getMailById = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const id = parseInt(req.params.id); // Gets the id from the path and converts it to a number.
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid mail ID' });
  }

  const mail = Mail.getMailById(id); // Searching for the mail in the model.
  // If the mail is not found we will return 404.
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  // if the mail is found, but the sender/receiver is not the user - return 401 unauthorized
  const isAuthorized =
    mail.from === user.email ||
    mail.to === user.email 
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized to view this mail' });
  }

  // TODO: check if the labels should be returned, if it is linked with the mail in that way
  const { from, to, subject, content, labels, dateSent } = mail;
  res.json({ id, from, to, subject, content, labels, dateSent }); // Returns the mail data
};

exports.editMailById = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  // check the mail id's validity
  const mailId = parseInt(req.params.id);
  const mail = Mail.getMailById(mailId);
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  // Check if the user is allowed to edit the mail - the user is the sender
  if (mail.senderId !== sender.id) {
    return res.status(403).json({ error: 'Not authorized to edit this mail' });
  }

  const { subject, content } = req.body;

  // validate that one of them was passed
  if (!subject && !content) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  Mail.updateMailById(mailId, { subject, content });

  return res.status(204).send(); // No Content
}

exports.deleteMailById = (req, res) => {

}