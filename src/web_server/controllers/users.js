const User = require('../models/users');

// Defines a post registration function.
exports.registerUser = (req, res) => {
  const { email, password, phone_number, birthDate, gender } = req.body;

  // Checks that all required fields are present.
  if (!email || !password || !phone_number|| !birthDate|| !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Creates the user and sends a response with his ID.
  const newUser = User.createUser(req.body);
  res.status(201).json({ id: newUser.id });
};

exports.getUserById = (req, res) => {
  const id = parseInt(req.params.id); // Gets the id from the path and converts it to a number.
  const user = User.getUserById(id); // Searching for the user in the model.
 
  // If the user is not found we will return 404.
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { email, phone_number, birthDate, gender, image } = user;
  res.json({ id, email, phone_number, birthDate, gender, image }); // Returns the user data (without password for security reasons).
};
