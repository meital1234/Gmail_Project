const Token = require('../models/tokens');

/**
 * Store a JWT token for logout/session invalidation.
 */
async function storeToken(userId, jwtToken) {
  if (!userId || !jwtToken) throw new Error('userId and token are required');
  await Token.create({ user: userId, token: jwtToken });
}

/**
 * Check whether a JWT is still valid (exists in store).
 */
async function isValidToken(jwtToken) {
  if (!jwtToken) return false;
  return !!(await Token.exists({ token: jwtToken }));
}

/**
 * Remove a JWT from the store (logout).
 */
async function removeToken(jwtToken) {
  if (!jwtToken) throw new Error('token is required');
  await Token.deleteOne({ token: jwtToken });
}

/**
 * Retrieve the userId that owns this JWT, or null.
 */
async function getUserByToken(jwtToken) {
  if (!jwtToken) return null;
  const doc = await Token.findOne({ token: jwtToken }).lean();
  return doc ? doc.user : null;
}

module.exports = {
  storeToken,
  isValidToken,
  removeToken,
  getUserByToken
};
