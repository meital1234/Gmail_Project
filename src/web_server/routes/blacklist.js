const express = require('express');
const router  = express.Router();
const controller    = require('../controllers/blacklist');

// POST   /api/blacklist
// DELETE /api/blacklist/:id
router
  .post('/', controller.addUrlToBlacklist)
  .delete('/:id', controller.deleteUrlFromBlacklist);

module.exports = router;
