const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

// Label for organizing mails (per user)
const labelSchema = new Schema({
  // Name of the label (e.g. 'Inbox', 'Spam', etc.)
  name: { type: String, required: true },

  // Owner of this label
  userId: { type: Types.ObjectId, ref: 'User', required: true }
}, {
  versionKey: false
});

module.exports = model('Label', labelSchema);
