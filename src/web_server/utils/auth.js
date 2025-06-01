const Users = require('../models/users');       // used to connect to the users we have registered
const Tokens = require('../models/tokens');       // used to connect to the users we have logged in

// helper function to use in the beggining of each authentication proccess
// for actions where a registered user is needed
function getAuthenticatedUser(req, res) {
  const token = req.headers['authorization'];
  if (!token || isNaN(token)) {
    res.status(401).json({ error: 'Missing or invalid Authorization token' });
    return null;
  }
  // translate token to userID
  const userId = Tokens.getUserByToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
  // translate userID to the user object itself
  const user = Users.getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  return user;
}

module.exports = { getAuthenticatedUser };