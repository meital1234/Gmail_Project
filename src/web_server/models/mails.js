// src/models/mails.js
const mongoose = require('mongoose')
const { Schema, model, Types } = mongoose

// Mail schema: only the fields we persist, nothing else.
// Service layer will handle create/update/delete logic.
const mailSchema = new Schema({
  mailId:      { type: Number, unique: true },
  from:        { type: String, required: true },
  to:          { type: String },
  senderId:    { type: Types.ObjectId, ref: 'User', required: true },
  receiverId:  { type: Types.ObjectId, ref: 'User' },
  subject:     { type: String },
  content:     { type: String },
  labelIds:    [{ type: Types.ObjectId, ref: 'Label' }],
  dateSent:    { type: Date, default: Date.now },
  hiddenFrom:  [{ type: Types.ObjectId, ref: 'User' }],
  isSpam:      { type: Boolean, default: false }
}, { versionKey: false });

// Export only Mongoose model
module.exports = model('Mail', mailSchema)
