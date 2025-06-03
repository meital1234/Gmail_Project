const Users = require('../models/users');   // needed to identify the sender and receiver id by token
const Mail = require('../models/mails');
const Labels =require('../models/labels')
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed
const { extractLinks } = require('../utils/linkExtraction');
const { checkLinks } = require('../utils/TCPclient');
const send = require('send');

// function resolveLabelNames(labelIds) {
//   return labelIds
//     .map(id => Labels.getLabelById(id))
//     .filter(label => label !== null)
//     .map(label => label.name);
// }

exports.getInbox = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const inbox = Mail.getLatestMailsForUser(sender.id);

  // filter only the fields i want to return to the user (no IDs)
  const filteredInbox = inbox.map(({ id, from, to, subject, content, dateSent, labels }) => ({
    id,
    from,
    to,
    subject,
    content,
    dateSent,
    labels
  }));
  res.json(filteredInbox);
};

exports.sendMail = async (req, res) => {
  // ---------------- input checks ----------------
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const { toEmail, subject, content, labels } = req.body;
  // Checks that all required fields are present - in this case only the target email
  if (!toEmail) {
    return res.status(400).json({ error: 'Receiver email is required' });
  }

  // verify the recipient email
  const recipient = Users.getUserByEmail(toEmail);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }

  // Get label names from the request
  // const labelNames = labels || [];

  // Convert names to label objects
  // const labelObjects = labelNames.map(name =>
  //   Labels.getAllLabels().find(l => l.name === name)
  // );

  // // Check if any are missing
  // if (labelObjects.includes(undefined)) {
  //   return res.status(400).json({ error: 'One or more labels do not exist' });
  // }

  // Convert to label IDs
  // const labelIds = labelObjects.map(l => l.id);
  const labelIds = []

  // extract all links in the mail for blacklist check
  const links = extractLinks(subject.concat(content));
  const hasBlacklisted = await checkLinks(links);
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
    labelIds,
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

  const { from, to, subject, content, labels, dateSent } = mail;
  res.json({
    id,
    from,
    to,
    subject,
    content,
    dateSent,
    labels
  }); // Returns the mail data
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

  // Check if the user is allowed to edit the mail - only the sender
  if (mail.senderId !== sender.id) {
    return res.status(403).json({ error: 'Not authorized to edit this mail' });
  }

  const { subject, content, labels } = req.body;

  // validate that one of them was passed
  if (!subject && !content && !labels) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  let labelIds = undefined;
  // if (labels) {
  //   const labelObjects = labels.map(name =>
  //     Labels.getAllLabels().find(
  //       l => l.name.trim().toLowerCase() === name.trim().toLowerCase()
  //     )
  //   );
  //   if (labelObjects.includes(undefined)) {
  //     return res.status(400).json({ error: 'One or more labels do not exist' });
  //   }
  //   labelIds = labelObjects.map(l => l.id);
  // }

  Mail.updateMailById(mailId, { subject, content, labels: labelIds });

  return res.status(204).send(); // No Content
}

exports.deleteMailById = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  // check the mail id's validity
  const mailId = parseInt(req.params.id);
  const mail = Mail.getMailById(mailId);
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  // Check if the user is allowed to delete the mail - only the sender
  if (mail.senderId !== user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this mail' });
  }

  Mail.deleteMailById(mailId);
  return res.status(204).send(); // No Content
}

// GET /api/mails/search/:query -> returns 200 OK & JSON array of matching mails
exports.searchMails = (req, res) => {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;
  const { query } = req.params;
  const allMatches = Mail.searchMails(query);
  // filter mails user sent \ received
  const visible = allMatches.filter(m =>
    m.senderId === user.id || m.recieverId === user.id
  );
  const latest50 = visible // sort newest to oldest 
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50);
  // project only public fields
  const payload = latest50.map(({ id, from, to, subject, content, dateSent, labels }) => ({
    id, from, to, subject, content, dateSent, labels
  }));
  return res.status(200).json(payload);
};