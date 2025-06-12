const express = require('express');
const router = express.Router();
const controller = require('../controllers/users');
console.log("controller:", controller); // שורת הבדיקה

router.route('/')
  .post(controller.registerUser); // POST /api/users

// router.route('/:id')
//   .get(controller.getUserById);  // GET /api/users/:id

module.exports = router; // Exports the router so it can be used in app.js.
