const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
    addQuestion, 
    getQuestions, 
    updateQuestion, 
    deleteQuestion,
    scheduleTest,
    getTests,
    getTestResults,
    getStudentTestDetails,
    addQuestionsBulk,
    getPendingStudents,
    approveStudent,
    getApprovedStudents,
    deleteStudent
} = require('../controllers/adminController');

// All these routes are protected and require admin privileges
router.use(protect, admin);
router.get('/students/pending', getPendingStudents);
router.get('/students/approved', getApprovedStudents);
router.put('/students/approve/:id', approveStudent);
router.delete('/students/:id', deleteStudent);
router.route('/questions').post(addQuestion).get(getQuestions);
router.route('/questions/:id').put(updateQuestion).delete(deleteQuestion);

router.route('/tests').post(scheduleTest).get(getTests);

// ✨ FIX: The more specific route must be defined BEFORE the more general one.
// This ensures that requests for a specific student's details are handled correctly.
router.get('/results/:testId/student/:studentId', getStudentTestDetails);

// This general route will now only be matched if the one above is not.
router.get('/results/:testId', getTestResults);
router.post('/questions-bulk', addQuestionsBulk);

module.exports = router;
