let idCounter = 0;
const labels = []; // array to store all labels in memory.

function createLabel({ name }) {
  const newLabel = { id: (++idCounter).toString(), name };
  labels.push(newLabel);
  return newLabel;
}

function getAllLabels() {
  return labels;
}

function getLabelById(id) {
  return labels.find(l => l.id === id) || null;
}

function updateLabelById(id, newData) {
  const label = getLabelById(id);
  if (!label) return null;
  if (newData.name) label.name = newData.name;
  return label;
}

function getLabelByName(name) {
  return labels.find(l => l.name === name) || null;
}

function deleteLabelById(id) {
  const index = labels.findIndex(l => l.id === id);
  if (index === -1) return false;
  labels.splice(index, 1);
  return true;
}

module.exports = {
  createLabel,
  getAllLabels,
  getLabelById,
  updateLabelById,
  getLabelByName,
  deleteLabelById
};
