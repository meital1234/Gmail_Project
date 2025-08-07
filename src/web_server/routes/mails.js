const express = require('express');
const router  = express.Router();
const controller    = require('../controllers/mails');

// GET  /api/mails/search/:query
router.get('/search/:query', controller.searchMails);

// GET  /api/mails/label/:labelId
router.get('/label/:labelId', controller.getMailsByLabel);

// GET  /api/mails
// POST /api/mails
router
  .route('/')
  .get(controller.getInbox)
  .post(controller.sendMail);

// GET    /api/mails/:id
// PATCH  /api/mails/:id
// DELETE /api/mails/:id
router
  .route('/:id')
  .get(controller.getMailById)
  .patch(controller.editMailById)
  .delete(controller.deleteMailById);

// POST   /api/mails/:mailId/labels/:labelId
// DELETE /api/mails/:mailId/labels/:labelId
router
  .route('/:mailId/labels/:labelId')
  .post(controller.addLabelToMail)
  .delete(controller.removeLabelFromMail);

module.exports = router;
