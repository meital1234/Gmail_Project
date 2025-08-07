const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// User account, with authentication and profile fields
const userSchema = new Schema({
  // User’s email (unique, normalized to lowercase)
  email: { type: String, required: true, unique: true, lowercase: true },

  // Hashed password (bcrypt)
  passwordHash: { type: String, required: true },

  // User’s given name
  first_name: { type: String },

  // User’s family name
  last_name: { type: String },

  // Contact phone number
  phone_number: { type: String },

  // Date of birth
  birthDate: { type: Date },

  // Gender string (e.g. 'female', 'male', etc.)
  gender: { type: String },

  // Profile image URL — defaults to a system placeholder
  image: { 
    type: String, 
    default: 'http://localhost:3000/static/default-profile.png' 
  },

  // Account creation timestamp
  createdAt: { type: Date, default: Date.now }
}, {
  versionKey: false
});

module.exports = model('User', userSchema);
