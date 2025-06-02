const Label = require('../models/labels');


exports.getAllLabels = (req, res) => {
  res.json(Label.getAllLabels());
};

exports.getByLabelId = (req, res) => {
  const label = Label.getLabelById(req.params.id);
  if (!label) return res.status(404).json({ error: 'Label not found' });
  res.json(label);
};

exports.createLabel = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const newLabel = Label.createLabel({ name });
  res.status(201).location(`/api/labels/${newLabel.id}`).send();
};

exports.updateLabel = (req, res) => {
  const updated = Label.updateLabelById(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Label not found' });
  res.status(204).send();
};

exports.deleteLabel = (req, res) => {
  const success = Label.deleteLabelById(req.params.id);
  if (!success) return res.status(404).json({ error: 'Label not found' });
  res.status(204).send();
};
