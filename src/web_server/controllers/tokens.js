const User = require('../models/users');

exports.login = (req, res) => {
  const { email, password } = req.body; // Gets username and password from the request body.

  // Checks that all required fields are present.
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = User.getUserByCredentials(email, password);

  // Checks if the user exists with the login information. if not we will return 401.
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Returns a token containing the user id.
  const token = `${user.id}`;
  res.status(200).json({ token });
};
