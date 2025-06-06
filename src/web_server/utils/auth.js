require('dotenv').config();
const jwt = require('jsonwebtoken');
const Users = require('../models/users');       // used to connect to the users we have registered
const Tokens = require('../models/tokens');       // used to connect to the users we have logged in

// helper function to use in the beggining of each authentication proccess
// for actions where a registered user is needed
function getAuthenticatedUser(req, res) {
  // extract the Authorization header, expecting format "Bearer <token>"
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  // obtain the raw token string
  // const token = req.headers['authorization'];
  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization token' });
    return null;
  }
  // verify that the token didnt become invalid
  if (!Tokens.isValidToken(token)) {
    res.status(403).json({ error: 'Token is not valid or has been logged out' });
    return null;
  }
  // verify JWT signature & expiration using the secret from .env
  let payload;
  try { // verifies token valid & signatures correct and not expired
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {  // if error we check its type
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' }); // error tokens expiration
    } else {
      res.status(403).json({ error: 'Token invalid' }); // error signatures validity
    }
    return null;
  }
  // Extract userId from payload & fetch the user object
  const userId = payload.sub;
  const user = Users.getUserById(userId);
  // if (!userId) {
  //   res.status(401).json({ error: 'Invalid or expired token' });
  //   return null;
  // }

  // translate userID to the user object itself
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  return user;
}

module.exports = { getAuthenticatedUser };