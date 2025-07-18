const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboard, getTestQuestions, submitTest } = require('../controllers/studentController');

// All these routes are protected and require student login
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/test/:testId', getTestQuestions);
router.post('/test/submit', submitTest);

module.exports = router;