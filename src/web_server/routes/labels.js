const express = require('express');
const router = express.Router();
const controller = require('../controllers/labels');

// ---------------- labeling routes ----------------
router.route('/')
        .get(controller.getAllLabels)
        .post(controller.createLabel);

router.route('/:id')
        .get(controller.getByLabelId)
        .patch(controller.updateLabel)
        .delete(controller.deleteLabel);

module.exports = router;