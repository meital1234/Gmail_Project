const userService           = require('../services/users');
const { getAuthenticatedUser } = require('../utils/auth');

const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

/**
 * POST /api/users
 * Register new user + default labels.
 */
exports.registerUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone_number, birthDate, gender, image } = req.body;

    // basic field checks
    if (!email || !password || !first_name || !phone_number || !birthDate || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!email.endsWith('@bloomly.com') || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be ≥8 chars, include uppercase, lowercase & number'
      });
    }
    if (!/^\d{9,15}$/.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    // age check
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 10) {
      return res.status(400).json({ error: 'Must be at least 10 years old' });
    }
    // optional image size/type
    if (image && !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // uniqueness
    if (await userService.getUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // create
    const user = await userService.createUser({ email, password, first_name, last_name, phone_number, birthDate, gender, image });
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    console.error('[UserController.registerUser]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/users/me
 * Return current user’s public profile.
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;
    res.json({
      id:         user._id,
      email:      user.email,
      first_name: user.first_name,
      last_name:  user.last_name,
      gender:     user.gender,
      image:      user.image
    });
  } catch (err) {
    console.error('[UserController.getCurrentUser]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
