// MongoDB connection helper (Mongoose)
const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGODB_URI.
 * Exits process on failure.
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ MongoDB connected');
  } catch (err) {
    console.error('✖ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
