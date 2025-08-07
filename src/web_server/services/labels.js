const Label = require('../models/labels');

/**
 * Create a new label for a given user.
 */
async function createLabel({ name, userId }) {
  if (!name || !userId) throw new Error('name and userId are required');
  return await Label.create({ name, userId });
}

/**
 * List all labels owned by a user.
 */
async function getAllLabelsByUser(userId) {
  if (!userId) throw new Error('userId is required');
  return await Label.find({ userId }).lean();
}

/**
 * Find one label by its id and owner.
 */
async function getLabelById({ id, userId }) {
  if (!id || !userId) throw new Error('id and userId are required');
  return await Label.findOne({ _id: id, userId }).lean();
}

/**
 * Update a label’s name.
 * Returns the updated label or null if not found.
 */
async function updateLabelById({ id, userId, newName }) {
  if (!id || !userId || !newName) throw new Error('id, userId, and newName are required');
  return await Label
    .findOneAndUpdate({ _id: id, userId }, { $set: { name: newName }}, { new: true })
    .lean();
}

/**
 * Find a label by exact (case-insensitive) name.
 */
async function getLabelByName({ name, userId }) {
  if (!name || !userId) throw new Error('name and userId are required');
  return await Label
    .findOne({ userId, name: new RegExp(`^${name}$`, 'i') })
    .lean();
}

/**
 * Delete a label by id and user.
 * Returns true if deleted.
 */
async function deleteLabelById({ id, userId }) {
  if (!id || !userId) throw new Error('id and userId are required');
  const res = await Label.deleteOne({ _id: id, userId });
  return res.deletedCount === 1;
}

module.exports = {
  createLabel,
  getAllLabelsByUser,
  getLabelById,
  updateLabelById,
  getLabelByName,
  deleteLabelById
};
