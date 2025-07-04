const express = require('express');
const router = express.Router();
const controller = require('../controllers/mails');

// ---------------- mailing routes ----------------
// GET /api/mails/search/:query
router.get('/search/:query', controller.searchMails);

// GET /api/mails
// POST /api/mails
router.route('/')
  .get(controller.getInbox)   // GET /mails
  .post(controller.sendMail); // POST /mails

// GET /api/mails/spam
router.get('/spam', controller.getSpam);

// PATCH /api/mails/:id/spam
router.patch('/:id/spam', controller.markAsSpam);

router.route('/:id')
  .get(controller.getMailById)        // GET /api/mails/:id
  .patch(controller.editMailById)     // PATCH /api/mails/:id
  .delete(controller.deleteMailById); // DELETE /api/mails/:id

router.route('/:mailId/labels/:labelId')
        .post(controller.addLabelToMail)
        .delete(controller.removeLabelFromMail)

module.exports = router; // exports the router so it can be used in app.js.
