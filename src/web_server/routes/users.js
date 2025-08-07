const express = require('express');
const router  = express.Router();
const controller    = require('../controllers/users');

// POST /api/users
router.post('/', controller.registerUser);

// GET /api/users/me
router.get('/me', controller.getCurrentUser);

module.exports = router;
