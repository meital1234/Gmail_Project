const Label = require('../models/labels');
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed


exports.getAllLabels = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;
  
  res.json(Label.getAllLabelsByUser());
};

exports.getByLabelId = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const label = Label.getLabelById(req.params.id);
  if (!label) return res.status(404).json({ error: 'Label not found' });
  res.json(label);
};

exports.createLabel = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  // make sure the label isnt in use for that user already
  const existing = Label.getLabelByName(name, sender.id);
  if (existing) {
    return res.status(403).json({ error: 'Label already exists' });
  }

  const newLabel = Label.createLabel( name, sender.id );
  res.status(201).location(`/api/labels/${newLabel.id}`).send();
};

exports.updateLabel = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;
  
  // make sure there is a label in that name for that user
  const exists = Label.getLabelById(req.params.id, sender.id);
  if (!exists) return res.status(404).json({ error: 'Label not found' });
  const updated = Label.updateLabelById(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Label not found not during update' });
  res.status(204).send();
};

exports.deleteLabel = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;

  // make sure the labels exists for the requesting user
  const existing = Label.getLabelById(req.params.id, sender.id);
  if (!existing) {
    return res.status(403).json({ error: 'Label not found' });
  }

  const success = Label.deleteLabelById(req.params.id, sender.id);
  if (!success) return res.status(404).json({ error: 'Label not found' });
  res.status(204).send();
};
