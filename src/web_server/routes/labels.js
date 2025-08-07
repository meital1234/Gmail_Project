const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/labels');

// GET    /api/labels        – list all labels
router.get('/', controller.getAllLabels);

// POST   /api/labels        – create new label
router.post('/', controller.createLabel);

// GET    /api/labels/:id    – fetch label by id
router.get('/:id', controller.getByLabelId);

// PATCH  /api/labels/:id    – rename label
router.patch('/:id', controller.updateLabel);

// DELETE /api/labels/:id    – delete label
router.delete('/:id', controller.deleteLabel);

module.exports = router;
