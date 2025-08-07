// src/web_server/controllers/labels.js
const labelSvc            = require('../services/labels');
const { getAuthenticatedUser } = require('../utils/auth');

/**
 * GET /api/labels
 */
exports.getAllLabels = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const labels = await labelSvc.getAllLabelsByUser(user._id);
  res.json(labels.map(({ _id, name }) => ({ id: _id, name })));
};

/**
 * GET /api/labels/:id
 */
exports.getByLabelId = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const label = await labelSvc.getLabelById({ id: req.params.id, userId: user._id });
  if (!label) return res.status(404).json({ error: 'Label not found' });

  res.json({ id: label._id, name: label.name });
};

/**
 * POST /api/labels
 */
exports.createLabel = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  if (await labelSvc.getLabelByName({ name, userId: user._id })) {
    return res.status(409).json({ error: 'Label already exists' });
  }

  const label = await labelSvc.createLabel({ name, userId: user._id });
  res.status(201).location(`/api/labels/${label._id}`).json({ id: label._id, name: label.name });
};

/**
 * PATCH /api/labels/:id
 */
exports.updateLabel = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const exists = await labelSvc.getLabelById({ id: req.params.id, userId: user._id });
  if (!exists) return res.status(404).json({ error: 'Label not found' });

  const updated = await labelSvc.updateLabelById({
    id: req.params.id,
    userId: user._id,
    newName: req.body.name
  });
  if (!updated) return res.status(404).json({ error: 'Label not found during update' });

  res.sendStatus(204);
};

/**
 * DELETE /api/labels/:id
 */
exports.deleteLabel = async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const label = await labelSvc.getLabelById({ id: req.params.id, userId: user._id });
  if (!label) return res.status(404).json({ error: 'Label not found' });

  if (['inbox', 'sent', 'drafts', 'spam'].includes(label.name.toLowerCase())) {
    return res.status(403).json({ error: `Cannot delete core label "${label.name}"` });
  }

  const ok = await labelSvc.deleteLabelById({ id: req.params.id, userId: user._id });
  if (!ok) return res.status(404).json({ error: 'Label not found' });

  res.sendStatus(204);
};
