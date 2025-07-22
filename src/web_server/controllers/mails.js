const Users = require('../models/users');   // needed to identify the sender and receiver id by token
const Mail = require('../models/mails');
const Labels = require('../models/labels');
const Blacklist = require('../models/blacklist');
const { getAuthenticatedUser } = require('../utils/auth');  // helper for authenticating a user
const { extractLinks } = require('../utils/linkExtraction');
const { checkLinks } = require('../utils/TCPclient');

exports.getInbox = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const inbox = Mail.getLatestMailsForUser(user.id);

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
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const { toEmail, subject, content, labels = [] } = req.body;

  const isDraft = labels.map(l => l.toLowerCase()).includes('drafts');

  // If not draft — require recipient
  if (!toEmail && !isDraft) {
    return res.status(400).json({ error: 'Receiver email is required' });
  }

  // If not draft — require recipient to exist
  let recipient = null;
  if (!isDraft) {
    recipient = Users.getUserByEmail(toEmail);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
  }

  const labelNames = labels || [];
  const labelObjects = labelNames.map(name =>
    Labels.getAllLabelsByUser(sender.id).find(l => l.name === name)
  );

  if (labelObjects.includes(undefined)) {
    return res.status(400).json({ error: 'One or more labels do not exist' });
  }

  const labelIds = labelObjects.map(l => l.id);

  if (!isDraft) {
    // Not a draft — add Sent label for sender
    const senderLabels = Labels.getAllLabelsByUser(sender.id);
    const sentLabel = senderLabels.find(l => l.name.toLowerCase() === 'sent');
    if (sentLabel && !labelIds.includes(sentLabel.id)) {
      labelIds.push(sentLabel.id);
    }

    if (recipient) {
      const recipientLabels = Labels.getAllLabelsByUser(recipient.id);
      const inboxLabel = recipientLabels.find(l => l.name.toLowerCase() === 'inbox');
      if (inboxLabel) {
        labelIds.push(inboxLabel.id);
      }
    }
  }

  // Create and send the mail
  const newMail = await Mail.createMail({
    from: sender.email,
    to: toEmail,
    senderId: sender.id,
    receiverId: recipient?.id,
    subject,
    content,
    labelIds,
    dateSent: new Date(),
  });

  // Determine proper response status
  const statusCode = newMail.isSpam ? 200 : 201;

  return res
    .status(statusCode)
    .location(`/api/mails/${newMail.id}`)
    .json({ id: newMail.id, isSpam: newMail.isSpam });
};

exports.getMailById = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const id = parseInt(req.params.id); // Gets the id from the path and converts it to a number.
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid mail ID' });
  }

  const mail = Mail.getMailById({ id, userId: user.id }); // Searching for the mail in the model.
  // If the mail is not found we will return 404.
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }
  // if the mail is still in the drafts of the sender - don't show it
  const draftLabel = Labels.getLabelByName({ name: "drafts", userId: mail.senderId });
  const isDraft = mail.labelIds?.includes(draftLabel?.id);

  if (user.id !== mail.senderId && isDraft) {
    return res.status(403).json({ error: 'Mail is still a draft' });
  }

  const { from, to, subject, content, labels, dateSent } = mail;

  const filteredLabels = labels.map(({ id, name }) => ({ id, name }));

  res.json({
    id,
    from,
    to,
    subject,
    content,
    dateSent,
    labels: filteredLabels
  }); // Returns the mail data
};

exports.editMailById = async (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  // check the mail id's validity
  const mailId = parseInt(req.params.id);
  const mail = Mail.getMailById({ id: mailId, userId: sender.id });
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  // Check if the user is allowed to edit the mail - only the sender
  if (mail.senderId !== sender.id) {
    return res.status(403).json({ error: 'Not authorized to edit this mail' });
  }

  // allow editing only for mails in drafts
  const draftLabel = Labels.getLabelByName({ name: "drafts", userId: sender.id });
  const hasDraftLabel = mail.labelIds?.includes(draftLabel?.id);

  if (!hasDraftLabel) {
    return res.status(403).json({ error: 'Only draft mails can be edited' });
  }

  const { toEmail, subject, content, labels } = req.body;

  // validate that one of them was passed
  if (!subject && !content && !labels) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // check links for blacklisted content
  const textToCheck = [subject, content].filter(Boolean).join(" ");
  if (textToCheck) {
    const links = extractLinks(textToCheck);
    const hasBlacklisted = await checkLinks(links);
    if (hasBlacklisted) {
      return res.status(400).json({ error: 'Mail contains malicious links' });
    }
  }

  let labelIds = undefined;
  if (labels) {
    // make sure the label exists for that user
    const labelObjects = labels.map(name =>
      Labels.getLabelByName({ name: name, userId: sender.id })
    );

    if (labelObjects.includes(null)) {
      return res.status(400).json({ error: 'One or more labels do not exist' });
    }

    labelIds = labelObjects.map(l => l.id);
  }

  Mail.updateMailById(mailId, { to: toEmail, subject, content, labels: labelIds });

  return res.status(204).send(); // No Content
};

exports.deleteMailById = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  // check the mail id's validity
  const mailId = parseInt(req.params.id);
  const mail = Mail.getMailById({ id: mailId, userId: user.id });
  if (!mail) {
    return res.status(404).json({ error: 'Mail not found' });
  }

  // Check if the user is allowed to delete the mail - only the sender
  if (mail.senderId !== user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this mail' });
  }

  // allow deleting only for mails in drafts
  const draftLabel = Labels.getLabelByName({ name: "drafts", userId: user.id });
  const hasDraftLabel = mail.labelIds?.includes(draftLabel?.id);

  if (!hasDraftLabel) {
    const success = Mail.deleteMailByIdForUser(mailId, user.id);
    if (!success) {
      return res.status(500).json({ error: 'Could not hide mail' });
    }

    return res.status(204).send(); // No Content
  }

  Mail.deleteMailById(mailId);
  return res.status(204).send(); // No Content
};

// GET /api/mails/spam -> returns 200 OK & JSON array of spam mails
// exports.getSpam = (req, res) => {
//   const user = getAuthenticatedUser(req, res);
//   if (!user) return;

//   const spam = Mail.getSpamMailsForUser(user.id)
//     .map(({ id, from, to, subject, content, dateSent, labels }) => ({
//       id,
//       from,
//       to,
//       subject,
//       content,
//       dateSent,
//       labels
//     }));
//   res.json(spam);
// };

// mark a mail as spam and add its links to blacklist
async function _markMailAsSpam(mail) {
  // use the model's logic to handle blacklist adding
  const ok = await Mail.markMailAsSpamById(mail.id);
  if (!ok) throw new Error('Failed to mark as spam');

  // and label adding to mail on both sides
  const maybeAttach = (userId) => {
    const lbl = Labels.getLabelByName({ name: 'spam', userId });
    if (lbl && !mail.labelIds.includes(lbl.id)) mail.labelIds.push(lbl.id);
  };
  maybeAttach(mail.senderId);
  maybeAttach(mail.receiverId);
}

exports.searchMails = (req, res) => {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;
  const { query } = req.params;

  const matchedMails = Mail.searchMails(query, user.id);

  const latest50 = matchedMails
    .sort((a, b) => b.dateSent - a.dateSent)
    .slice(0, 50);

  const payload = latest50.map(mail => {
    const filteredLabels = (mail.labelIds || [])
      .map(id => Labels.getLabelById({ id, userId: user.id }))
      .filter(label => label)
      .map(({ id, name }) => ({ id, name }));

    return {
      id: mail.id,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      content: mail.content,
      dateSent: mail.dateSent,
      labels: filteredLabels
    };
  });

  return res.status(200).json(payload);
};

exports.addLabelToMail = async (req, res) => {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const mailId  = parseInt(req.params.mailId);
  const labelId = parseInt(req.params.labelId);

  const mail = Mail.getMailById({ id: mailId, userId: user.id });
  if (!mail) return res.status(404).json({ error: 'Mail not found' });

  const label = Labels.getLabelById({ id: labelId, userId: user.id });
  if (!label) return res.status(404).json({ error: 'Label not found' });

  // avoid duplicates
  if (mail.labelIds.includes(labelId)) return res.sendStatus(204);

  // if the requested label is SPAM - handle accordingly      
  if (label.name.toLowerCase() === 'spam') {
    try {
      await _markMailAsSpam(mail);    // helper
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    mail.labelIds.push(labelId);       
  }

  return res.sendStatus(204);

};

exports.removeLabelFromMail = async (req, res) => {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const mailId = parseInt(req.params.mailId);
  const labelId = req.params.labelId;

  const mail = Mail.getMailById({ id: mailId, userId: user.id });
  if (!mail) return res.status(404).json({ error: 'Mail not found' });

  const label = Labels.getLabelById({ id: labelId, userId: user.id });
  if (!label) return res.status(404).json({ error: 'Label not found' });

  const idx = mail.labelIds.indexOf(labelId);
  if (idx === -1) return res.sendStatus(204);   // nothing to remove

  /* protect core system labels */
  const core = ['drafts', 'inbox', 'sent'];
  const lname = label.name.toLowerCase();
  if (core.includes(lname))
    return res.status(403).json({ error: `Cannot remove ${label.name} label` });

  // handle spam label removal
  if (lname === 'spam') {
    mail.labelIds.splice(idx, 1);   // remove the label
    mail.isSpam = false;            // mail considered clean

    // extract its URLs and drop them from blacklist
    const links = extractLinks(mail.content);
    for (const link of links) {
      // remove link if it esixts in the blacklist
      if (await Blacklist.isBlacklisted(link)) {
        await Blacklist.deleteUrl(link);
      }
    }

    return res.sendStatus(204);
  }

  // handle normal label removal
  mail.labelIds.splice(idx, 1);
  return res.sendStatus(204);

};
