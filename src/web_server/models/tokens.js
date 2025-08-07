const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

// Stored JWT tokens for logout and session invalidation
const tokenSchema = new Schema({
  // Reference to the User who owns this token
  user: { type: Types.ObjectId, ref: 'User', required: true },

  // The JWT string itself (unique)
  token: { type: String, required: true, unique: true, index: true },

  // Creation time, automatically expires (TTL) after 30 days
  createdAt: { type: Date, default: Date.now, expires: '30d' }
}, {
  versionKey: false
});

module.exports = model('Token', tokenSchema);
