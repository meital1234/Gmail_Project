const express = require('express');
const router = express.Router();
const controller = require('../controllers/tokens');

router.post('/', controller.login); // POST /api/tokens

module.exports = router; // Exports the router so it can be used in app.js.
