const bcrypt         = require('bcrypt');
const User           = require('../models/users');
const labelService   = require('./labels');

const SALT_ROUNDS = +process.env.BCRYPT_SALT_ROUNDS || 10;

/**
 * Create a new user, hash password, and generate default labels.
 */
async function createUser({
  email, password,
  first_name, last_name,
  phone_number, birthDate,
  gender, image
}) {
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  // hash the plaintext password
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const passwordHash = await bcrypt.hash(password, salt);

  // create the user document
  const user = await User.create({
    email, passwordHash,
    first_name, last_name,
    phone_number, birthDate,
    gender, image
  });

  // initialize system labels for this user
  const defaults = ['Inbox','Sent','Starred','Important','Drafts','Spam'];
  await Promise.all(
    defaults.map(name => labelService.createLabel({ name, userId: user._id }))
  );

  return user.toObject();
}

/**
 * Find user by ObjectId.
 */
async function getUserById(id) {
  if (!id) throw new Error('User id is required');
  return await User.findById(id).lean();
}

/**
 * Find user by email address.
 */
async function getUserByEmail(email) {
  if (!email) throw new Error('Email is required');
  return await User.findOne({ email }).lean();
}

/**
 * Validate credentials: return user object or null.
 */
async function getUserByCredentials(email, password) {
  if (!email || !password) return null;
  const user = await User.findOne({ email });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user.toObject() : null;
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByCredentials
};
