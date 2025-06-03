const Label = require('../models/labels');
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed


exports.getAllLabels = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;
  res.json(Label.getAllLabels());
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
  // make sure the email address isnt in use already
  const existing = Label.getLabelByName(name);
  if (existing) {
    return res.status(403).json({ error: 'Label already exists' });
  }
  const newLabel = Label.createLabel({ name });
  res.status(201).location(`/api/labels/${newLabel.id}`).send();
};

exports.updateLabel = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;
  const updated = Label.updateLabelById(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Label not found' });
  res.status(204).send();
};

exports.deleteLabel = (req, res) => {
  // make sure token is passed by header and is an actual user and that the user is logged in
  const sender = getAuthenticatedUser(req, res);
  if (!sender) return;
  const success = Label.deleteLabelById(req.params.id);
  if (!success) return res.status(404).json({ error: 'Label not found' });
  res.status(204).send();
};
