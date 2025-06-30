const express = require('express');
const router = express.Router();
const controller = require('../controllers/mails');

// ---------------- mailing routes ----------------
router.get('/search/:query', controller.searchMails); // GET /api/mails/search/:query

router.route('/')
        .get(controller.getInbox)   // GET /mails
        .post(controller.sendMail)  // POST /mails

router.route('/:id')
        .get(controller.getMailById)  // GET /api/mails/:id
        .patch(controller.editMailById)  // PATCH /api/mails/:id
        .delete(controller.deleteMailById)  // DELETE /api/mails/:id

router.route('/:mailId/labels/:labelId')
        .post(controller.addLabelToMail)
        .delete(controller.removeLabelFromMail)

module.exports = router; // exports the router so it can be used in app.js.
