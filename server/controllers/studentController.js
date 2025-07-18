const pool = require('../config/db');

// @desc    Get student dashboard data (scheduled tests and past scores)
// @route   GET /api/student/dashboard
// @access  Private
const getDashboard = async (req, res) => {
    // Get the student's ID and college_id from the authenticated user object
    const { id: studentId, college_id } = req.user;

    // If the student is not associated with a college, return empty lists.
    if (!college_id) {
        return res.json({
            greeting: `Hello, ${req.user.name}`,
            scheduledTests: [],
            pastScores: []
        });
    }

    try {
        // ✨ FIX: The query now joins with the tests table and adds a WHERE clause
        // to ensure it only fetches tests scheduled for the student's specific college.
        const [scheduledTests] = await pool.query(
            `SELECT t.id, t.title, t.duration_minutes, t.scheduled_at 
             FROM tests t
             JOIN student_tests st ON t.id = st.test_id
             WHERE st.student_id = ? AND t.college_id = ? AND st.status = 'scheduled'`,
            [studentId, college_id]
        );

        // ✨ FIX: This query is also updated to only show scores from tests
        // belonging to the student's college.
        const [pastScores] = await pool.query(
            `SELECT t.title, st.score, st.submitted_at
             FROM tests t
             JOIN student_tests st ON t.id = st.test_id
             WHERE st.student_id = ? AND t.college_id = ? AND st.status = 'completed'`,
            [studentId, college_id]
        );

        res.json({
            greeting: `Hello, ${req.user.name}`,
            scheduledTests,
            pastScores
        });
    } catch (error) {
        console.error("Error fetching student dashboard:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get questions for a specific test and start the test
// @route   GET /api/student/test/:testId
// @access  Private
const getTestQuestions = async (req, res) => {
    const { testId } = req.params;
    const { id: studentId, college_id } = req.user;

    try {
        // ✨ FIX: The verification query now also checks that the test's college_id
        // matches the student's college_id, adding a crucial layer of security.
        const [studentTest] = await pool.query(
            `SELECT st.* FROM student_tests st
             JOIN tests t ON st.test_id = t.id
             WHERE st.test_id = ? AND st.student_id = ? AND t.college_id = ? AND st.status = 'scheduled'`,
            [testId, studentId, college_id]
        );

        if (studentTest.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to take this test or it has already been taken.' });
        }

        // Fetch questions for the test (this part remains the same)
        const [questions] = await pool.query(
            `SELECT q.id, q.question_text, q.type, q.language, q.options, q.expected_output 
             FROM questions q
             JOIN test_questions tq ON q.id = tq.question_id
             WHERE tq.test_id = ?`,
            [testId]
        );

        // Mark test as 'inprogress'
        await pool.query(
            'UPDATE student_tests SET status = "inprogress", started_at = NOW() WHERE id = ?',
            [studentTest[0].id]
        );

        res.json({ questions, studentTestId: studentTest[0].id });

    } catch (error) {
        console.error("Error getting test questions:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit a test and calculate the score
// @route   POST /api/student/test/submit
// @access  Private
const submitTest = async (req, res) => {
    const { studentTestId, answers } = req.body;
    const { id: studentId, college_id } = req.user; // Get college_id from logged-in student
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        let score = 0;
        
        if (!answers || answers.length === 0) {
            // Handle case where test is submitted with no answers
            await connection.query(
                'UPDATE student_tests SET score = 0, status = "completed", submitted_at = NOW() WHERE id = ? AND student_id = ?',
                [studentTestId, studentId]
            );
            await connection.commit();
            return res.json({ message: 'Test submitted successfully!', score: 0 });
        }
        
        const questionIds = answers.map(a => a.question_id);
        const [questionRows] = await connection.query(`SELECT * FROM questions WHERE id IN (?)`, [questionIds]);
        const questionsMap = new Map(questionRows.map(q => [q.id, q]));
        
        const answerPromises = answers.map(async (answer) => {
            const q = questionsMap.get(answer.question_id);
            if (!q) return;

            let is_correct = false;
            if (q.type === 'mcq') {
                const optionsArray = JSON.parse(q.options);
                const correctOptionKey = q.correct_option.toUpperCase();
                const correctIndex = correctOptionKey.charCodeAt(0) - 65;
                const correctAnswerText = optionsArray[correctIndex];
                if (answer.answer_text === correctOptionKey || answer.answer_text === correctAnswerText) {
                    is_correct = true;
                    score++;
                }
            } else if (q.type === 'code') {
                if (answer.answer_text && q.solution && answer.answer_text.trim() === q.solution.trim()) {
                   is_correct = true;
                   score++;
                }
            }
            
            // ✨ FIX: Insert the student's college_id into the student_answers table
            return connection.query(
                'INSERT INTO student_answers (student_test_id, question_id, answer_text, is_correct, college_id) VALUES (?, ?, ?, ?, ?)',
                [studentTestId, answer.question_id, answer.answer_text || '', is_correct, college_id]
            );
        });

        await Promise.all(answerPromises);

        await connection.query(
            'UPDATE student_tests SET score = ?, status = "completed", submitted_at = NOW() WHERE id = ? AND student_id = ?',
            [score, studentTestId, studentId]
        );

        await connection.commit();
        res.json({ message: 'Test submitted successfully!', score });

    } catch (error) {
        await connection.rollback();
        console.error("Error submitting test:", error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

module.exports = { getDashboard, getTestQuestions, submitTest };
