const express = require('express');
const router = express.Router();
const controller = require('../controllers/mails');

// ---------------- mailing routes ----------------
router.route('/')
        .get(controller.getInbox)   // GET /mails
        .post(controller.sendMail)  // POST /mails

router.route('/:id')
        .get(controller.getMailById) // GET /mails/:id
        .patch(controller.editMailById)  // PATCH /mails/:id
        .patch(controller.deleteMailById)    // DELETE /mails/:id


module.exports = router; // Exports the router so it can be used in app.js.
