const express = require('express');
const router = express.Router();
const controller = require('../controllers/blacklist');

// ---------------- blacklist routes ----------------
router.route('/')
        .post(controller.addUrlToBlacklist)  // POST /blacklist

router.route('/:id')
        .delete(controller.deleteUrlFromBlacklist)    // DELETE /blacklist/:id


module.exports = router; // Exports the router so it can be used in app.js.
