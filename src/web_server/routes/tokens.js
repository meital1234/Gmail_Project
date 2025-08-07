const express = require('express');
const router  = express.Router();
const controller    = require('../controllers/tokens');

// POST /api/tokens
router.post('/', controller.login);

module.exports = router;
