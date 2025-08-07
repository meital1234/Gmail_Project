require('dotenv').config();
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcrypt');
const userService  = require('../services/users');
const tokenService = require('../services/tokens');

/**
 * POST /api/tokens
 * Authenticate and issue a JWT; store it for logout support.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await userService.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: user._id, email: user.email };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    await tokenService.storeToken(user._id, token);

    res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN });
  } catch (err) {
    console.error('[AuthController.login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
