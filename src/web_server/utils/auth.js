require('dotenv').config();
const jwt           = require('jsonwebtoken');
const userService   = require('../services/users');
const tokenService  = require('../services/tokens');

/**
 * Validate Bearer JWT, check token store, and return the user object.
 * On failure, sends a 4xx response and returns null.
 */
async function getAuthenticatedUser(req, res) {
  // 1) Extract "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return null;
  }

  // 2) Ensure token is still in store (not logged out)
  const userId = await tokenService.getUserByToken(token);
  if (!userId) {
    res.status(403).json({ error: 'Token is invalid or has been revoked' });
    return null;
  }

  // 3) Verify signature & expiration
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(403).json({ error: 'Token invalid' });
    }
    return null;
  }

  // 4) Fetch the user via service
  const user = await userService.getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  return user;
}

module.exports = { getAuthenticatedUser };
