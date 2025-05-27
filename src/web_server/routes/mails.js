const express = require('express');
const router = express.Router();

const mails = require('../controllers/mails');

// ---------------- mailing routes ----------------
// GET /mails
router.get('/', mails.getInbox);
// POST /mails
router.post('/', mails.sendMail);
// GET /mails/:id
router.get('/:id', mails.getMail);
// PATCH /mails/:id
router.patch('/:id', mails.editMail);
// DELETE /mails/:id
router.patch('/:id', mails.deleteMail);

module.exports = router; // Exports the router so it can be used in app.js.
