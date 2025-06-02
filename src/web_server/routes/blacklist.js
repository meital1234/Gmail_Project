const express = require('express');
const router = express.Router();
const controller = require('../controllers/blacklist');

// POST /api/blacklist
router.post('/', controller.addUrlToBlacklist);

// DELETE /api/blacklist/:id
router.delete('/:id', controller.deleteUrlFromBlacklist);

module.exports = router;
