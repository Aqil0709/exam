const pool = require('../config/db');

/* --- Question Management Functions --- */

// @desc    Add a new single question
// @route   POST /api/admin/questions
const addQuestion = async (req, res) => {
    const { question_text, type, language, options, correct_option, solution, expected_output } = req.body;
    const { id: created_by, college_id } = req.user; // Get college_id from logged-in admin

    if (!college_id) {
        return res.status(400).json({ message: 'You must be assigned to a college to add questions.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO questions (question_text, type, language, options, correct_option, solution, expected_output, created_by, college_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [question_text, type, language, options, correct_option, solution, expected_output, created_by, college_id]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("Error adding question:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add questions in bulk from Excel
// @route   POST /api/admin/questions-bulk
const addQuestionsBulk = async (req, res) => {
    const { questions } = req.body; 
    const { id: created_by, college_id } = req.user; // Get college_id from logged-in admin
    const connection = await pool.getConnection();

    if (!college_id) {
        return res.status(400).json({ message: 'You must be assigned to a college to add questions.' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'No questions provided or the format is incorrect.' });
    }

    try {
        await connection.beginTransaction();
        
        // The INSERT query now includes the college_id column
        const query = 'INSERT INTO questions (question_text, type, language, options, correct_option, solution, expected_output, created_by, college_id) VALUES ?';
        
        // Map the incoming questions to include the admin's college_id in each row
        const values = questions.map(q => [
            q.question_text, 
            q.type, 
            q.language || null, 
            q.options || null, 
            q.correct_option || null, 
            q.solution || null, 
            q.expected_output || null, 
            created_by, 
            college_id // Add college_id to each record
        ]);

        await connection.query(query, [values]);
        await connection.commit();
        res.status(201).json({ message: `Successfully added ${questions.length} questions.` });

    } catch (error) {
        await connection.rollback();
        console.error("Bulk insert error:", error);
        res.status(500).json({ message: 'Server Error during bulk insert.' });
    } finally {
        connection.release();
    }
};

// @desc    Get all questions
// @route   GET /api/admin/questions
const getQuestions = async (req, res) => {
    const { college_id } = req.user;
    if (!college_id) return res.json([]);
    try {
        const [questions] = await pool.query(
            'SELECT * FROM questions WHERE college_id = ? ORDER BY id DESC',
            [college_id]
        );
        res.json(questions);
    } catch (error) {
        console.error("Error getting questions:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a question
// @route   PUT /api/admin/questions/:id
const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { college_id } = req.user;
    const { question_text, type, language, options, correct_option, solution, expected_output } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE questions SET question_text = ?, type = ?, language = ?, options = ?, correct_option = ?, solution = ?, expected_output = ? WHERE id = ? AND college_id = ?',
            [question_text, type, language, options, correct_option, solution, expected_output, id, college_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found or you are not authorized to edit it.' });
        }
        res.json({ message: 'Question updated successfully' });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a question
// @route   DELETE /api/admin/questions/:id
const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    const { college_id } = req.user;
    try {
        const [result] = await pool.query(
            'DELETE FROM questions WHERE id = ? AND college_id = ?', 
            [id, college_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found or you are not authorized to delete it.' });
        }
        res.json({ message: 'Question removed' });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};



/* --- Test Management Functions --- */

// @desc    Schedule a new test
// @route   POST /api/admin/tests
const scheduleTest = async (req, res) => {
    const { title, duration_minutes, scheduled_at, question_ids } = req.body;
    const { id: created_by, college_id } = req.user; // Get college_id from the logged-in admin
    const connection = await pool.getConnection();

    // An admin must belong to a college to schedule a test
    if (!college_id) {
        return res.status(400).json({ message: 'You must be assigned to a college to schedule a test.' });
    }

    try {
        await connection.beginTransaction();

        const formatted_scheduled_at = new Date(scheduled_at).toISOString().slice(0, 19).replace('T', ' ');

        // ✨ FIX: Insert the admin's college_id into the tests table
        const [testResult] = await connection.query(
            'INSERT INTO tests (title, duration_minutes, scheduled_at, created_by, college_id) VALUES (?, ?, ?, ?, ?)',
            [title, duration_minutes, formatted_scheduled_at, created_by, college_id]
        );
        const testId = testResult.insertId;

        // Link questions to the test (no change here)
        if (question_ids && question_ids.length > 0) {
            const testQuestionsValues = question_ids.map(qId => [testId, qId]);
            await connection.query('INSERT INTO test_questions (test_id, question_id) VALUES ?', [testQuestionsValues]);
        }

        // ✨ FIX: Fetch and assign the test ONLY to students from the admin's college
        const [studentsInCollege] = await connection.query(
            "SELECT id FROM users WHERE role = 'student' AND status = 'approved' AND college_id = ?",
            [college_id]
        );

        if (studentsInCollege.length > 0) {
            const studentIdsToAssign = studentsInCollege.map(s => s.id);
            const studentTestsValues = studentIdsToAssign.map(sId => [sId, testId, 'scheduled']);
            await connection.query('INSERT INTO student_tests (student_id, test_id, status) VALUES ?', [studentTestsValues]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Test scheduled successfully for your college.', testId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

// @desc    Get all tests
// @route   GET /api/admin/tests
const getTests = async (req, res) => {
    const { college_id } = req.user; // Get college_id from the logged-in admin

    // If for some reason the admin has no college, return an empty list.
    if (!college_id) {
        return res.json([]);
    }

    try {
        // The WHERE clause now ensures only tests from the correct college are returned.
        const [tests] = await pool.query(
            'SELECT id, title FROM tests WHERE college_id = ? ORDER BY scheduled_at DESC',
            [college_id]
        );
        res.json(tests);
    } catch (error) {
        console.error("Error getting tests:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


/* --- Result & Analysis Functions --- */

// @desc    Get summary results for a specific test
// @route   GET /api/admin/results/:testId
const getTestResults = async (req, res) => {
    const { testId } = req.params;
    const { college_id } = req.user; // Get college_id from the logged-in admin

    try {
        // The JOIN with the tests table and the WHERE clause for college_id ensures
        // an admin can only view results for tests from their own college.
        const [results] = await pool.query(
            `SELECT st.id, st.student_id, u.name, u.email, st.score, st.status, st.submitted_at 
             FROM student_tests st
             JOIN users u ON st.student_id = u.id
             JOIN tests t ON st.test_id = t.id
             WHERE st.test_id = ? AND t.college_id = ? AND st.status = 'completed'
             ORDER BY st.score DESC`,
            [testId, college_id]
        );
        res.json(results);
    } catch (error) {
        console.error("Error getting test results:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ✨ UPDATED: This function now verifies the admin's college before returning details.
// @desc    Get detailed results for a single student's test
// @route   GET /api/admin/results/:testId/student/:studentId
// @access  Private/Admin
const getStudentTestDetails = async (req, res) => {
    const { testId, studentId } = req.params;
    const { college_id } = req.user; // Get college_id from the logged-in admin

    try {
        // This query now checks that the test belongs to the admin's college.
        const [studentTestInfo] = await pool.query(
            `SELECT u.name, u.email, t.title, st.score 
             FROM student_tests st 
             JOIN users u ON st.student_id = u.id 
             JOIN tests t ON st.test_id = t.id 
             WHERE st.test_id = ? AND st.student_id = ? AND t.college_id = ?`,
            [testId, studentId, college_id]
        );

        if (studentTestInfo.length === 0) {
            return res.status(404).json({ message: 'Test submission not found or you are not authorized to view it.' });
        }

        const [answers] = await pool.query(
            `SELECT q.id as question_id, q.question_text, q.type, q.options, q.correct_option, q.solution, sa.answer_text, sa.is_correct 
             FROM student_answers sa 
             JOIN questions q ON sa.question_id = q.id 
             JOIN student_tests st ON sa.student_test_id = st.id 
             WHERE st.test_id = ? AND st.student_id = ?`,
            [testId, studentId]
        );

        res.json({
            studentInfo: studentTestInfo[0],
            testInfo: { title: studentTestInfo[0].title },
            answers: answers.map(a => ({...a, options: JSON.parse(a.options || '[]')}))
        });
    } catch (error) {
        console.error("Error getting student test details:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


/* --- Student Management Functions --- */

// @desc    Get all students with a 'pending' status
// @route   GET /api/admin/students/pending
const getPendingStudents = async (req, res) => {
    const { college_id } = req.user;
    if (!college_id) {
        return res.json([]);
    }
    try {
        const [students] = await pool.query(
            "SELECT id, name, email, created_at FROM users WHERE role = 'student' AND status = 'pending' AND college_id = ? ORDER BY created_at DESC",
            [college_id]
        );
        res.json(students);
    } catch (error) {
        console.error("Error fetching pending students:", error);
        res.status(500).json({ message: 'Server error while fetching pending students.' });
    }
};

// ✨ UPDATED: This function now ensures an admin can only approve students from their own college.
const approveStudent = async (req, res) => {
    const { id } = req.params;
    const { college_id } = req.user;
    try {
        const [result] = await pool.query(
            "UPDATE users SET status = 'approved' WHERE id = ? AND role = 'student' AND college_id = ?",
            [id, college_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found in your college or already approved.' });
        }
        res.json({ message: 'Student approved successfully.' });
    } catch (error) {
        console.error("Error approving student:", error);
        res.status(500).json({ message: 'Server error while approving student.' });
    }
};

// ✨ UPDATED: This function now filters approved students based on the admin's college.
const getApprovedStudents = async (req, res) => {
    const { college_id } = req.user;
    if (!college_id) {
        return res.json([]);
    }
    try {
        const [students] = await pool.query(
            "SELECT id, name, email, created_at FROM users WHERE role = 'student' AND status = 'approved' AND college_id = ? ORDER BY name",
            [college_id]
        );
        res.json(students);
    } catch (error) {
        console.error("Error fetching approved students:", error);
        res.status(500).json({ message: 'Server error while fetching approved students.' });
    }
};

// ✨ UPDATED: This function now ensures an admin can only delete students from their own college.
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    const { college_id } = req.user;
    try {
        const [result] = await pool.query(
            "DELETE FROM users WHERE id = ? AND role = 'student' AND college_id = ?",
            [id, college_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found in your college.' });
        }
        res.json({ message: 'Student deleted successfully.' });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ message: 'Server error while deleting student.' });
    }
};


/* --- ✨ FIX: Consolidated and complete exports --- */
module.exports = { 
    addQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion,
    addQuestionsBulk,
    scheduleTest,
    getTests,
    getTestResults,
    getStudentTestDetails,
    getPendingStudents,
    approveStudent,
    getApprovedStudents,
    deleteStudent
};
