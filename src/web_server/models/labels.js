let idCounter = 0;
const labels = []; // array to store all labels in memory.

function createLabel({ name, userId }) {
  const newLabel = { id: (++idCounter).toString(), name, userId };
  labels.push(newLabel);
  return newLabel;
}

function getAllLabelsByUser(userId) {
  // return all the labels that are saved by the requesting user
  return labels.filter(label => label.userId === userId);
}

function getLabelById({id, userId}) {
  return labels.find(l => l.id === id && l.userId === userId) || null;
}

function updateLabelById({id, userId, newData}) {
  const label = getLabelById({id, userId});
  if (!label) return null;
  if (newData.name) label.name = newData.name;
  return label;
}

function getLabelByName({name, userId}) {
  return labels.find(l => l.name === name && l.userId === userId) || null;
}

function deleteLabelById({id, userId}) {
  const index = labels.findIndex(l => l.id === id && l.userId === userId);
  if (index === -1) return false;
  labels.splice(index, 1);
  return true;
}

module.exports = {
  createLabel,
  getAllLabelsByUser,
  getLabelById,
  updateLabelById,
  getLabelByName,
  deleteLabelById
};
