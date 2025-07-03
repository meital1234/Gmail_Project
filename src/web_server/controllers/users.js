require('dotenv').config();
const User = require('../models/users');
const { getAuthenticatedUser } = require('../utils/auth');  // helper function for the proccess of authenticating a user when needed

// email nust be in this format xxx@xxx
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// password must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;


// Defines a post registration function.
exports.registerUser = async (req, res) => {
  const { email, password, first_name, last_name, phone_number, birthDate, gender, image } = req.body;

  // Checks that all required fields are present.
  if (!email || !password || !first_name || !phone_number|| !birthDate|| !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!email.endsWith('@bloomly.com')) {
    return res.status(400).json({ error: 'Email must end with @bloomly.com' });
  }

  if (!emailRegex.test(email.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, and a number' 
    });
  }

  // Phone number validation
  const phonePattern = /^\d{9,15}$/;
  if (!phonePattern.test(phone_number)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  // Age validation
  const today = new Date();
  const userBirthDate = new Date(birthDate);
  const age = today.getFullYear() - userBirthDate.getFullYear();
  if (age < 10) {
    return res.status(400).json({ error: 'You must be at least 10 years old to sign up' });
  }

  // Image validation
  if (image) {
    // Make sure it's a base64 string that starts with a valid prefix
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Limit image size (base64 is ~33% bigger than binary)
    const base64Length = image.length * (3 / 4); // rough estimate
    const maxBytes = 1 * 1024 * 1024; // 1MB
    if (base64Length > maxBytes) {
      return res.status(400).json({ error: 'Image is too large (max 1MB)' });
    }
  }
  
  // make sure the email address isnt in use already
  const existing = User.getUserByEmail(email);
  if (existing) {
    return res.status(403).json({ error: 'Email address is already in use' });
  }
  // - // Creates the user and sends a response with his ID.
  // - const newUser = User.createUser(req.body);
  // - res.status(201).location(`/api/users/${newUser.id}`).send();
  try {
    const newUser = await User.createUser({ email, password, first_name, last_name, phone_number, birthDate, gender, image });
    // return id for user
    return res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error('Error in createUser:', err);
    return res.status(404).json({ error: 'User not found' });
  }
};

// GET /api/users/me
exports.getCurrentUser = (req, res) => {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  res.status(200).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    gender: user.gender,
    image: user.image || null
  });
};
