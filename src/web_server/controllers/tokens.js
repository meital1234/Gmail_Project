require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/users');
const Tokens = require('../models/tokens');

exports.login = async(req, res) => {
  const { email, password } = req.body; // Gets username and password from the request body.

  // Checks that all required fields are present.
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = User.getUserByEmail(email);
  // Checks if the user exists with the login information. if not we will return 401.
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // matching password & hashpassword
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // JWT for building payload
  const payload = {
    sub: user.id,
    email: user.email
  };

  
  // creating signed JWT with secret & expressin from .env
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // - // Returns a token containing the user id.
  // - const token = Tokens.createToken(user.id); // saves it in token store
  // - res.status(200).json({ token });
  
  // saving token in memory
  Tokens.storeToken(user.id, token);

  // returnig answer to user
  res.status(200).json({
    token,
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
