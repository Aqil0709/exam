const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser); // For student registration
router.post('/login', loginUser);       // For both student and admin login

module.exports = router;