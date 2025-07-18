const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// @desc    Create a new admin and assign them to a college
// @route   POST /api/master/admins
// @access  Private/Master
const createAdmin = async (req, res) => {
    // ✨ FIX: Destructure college_id from the request body
    const { name, email, password, college_id } = req.body;
    const masterId = req.user.id;

    if (!name || !email || !password || !college_id) {
        return res.status(400).json({ message: 'Please provide all fields, including assigning a college.' });
    }

    try {
        // Check if a user with this email already exists at the assigned college
        const [userExists] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND college_id = ?', 
            [email, college_id]
        );
        if (userExists.length > 0) {
            return res.status(400).json({ message: 'An admin with this email already exists at this college.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✨ FIX: The INSERT query now correctly includes the college_id
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, created_by, college_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin', masterId, college_id]
        );

        res.status(201).json({ id: result.insertId, name, email, role: 'admin' });
    } catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({ message: 'Server error while creating admin.' });
    }
};

// @desc    Get all admins created by the master, including their college name
// @route   GET /api/master/admins
// @access  Private/Master
const getAdmins = async (req, res) => {
    const masterId = req.user.id;
    try {
        // The query now joins with the colleges table to get the college name
        const [admins] = await pool.query(
            `SELECT u.id, u.name, u.email, u.created_at, c.name as college_name 
             FROM users u 
             LEFT JOIN colleges c ON u.college_id = c.id 
             WHERE u.role = 'admin' AND u.created_by = ?`,
            [masterId]
        );
        res.json(admins);
    } catch (error) {
        console.error("Error fetching admins:", error);
        res.status(500).json({ message: 'Server error while fetching admins.' });
    }
};

// @desc    Delete an admin
// @route   DELETE /api/master/admins/:id
// @access  Private/Master
const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    const masterId = req.user.id;
    try {
        const [result] = await pool.query(
            "DELETE FROM users WHERE id = ? AND role = 'admin' AND created_by = ?",
            [id, masterId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Admin not found or you are not authorized to delete this user.' });
        }
        res.json({ message: 'Admin user deleted successfully.' });
    } catch (error) {
        console.error("Error deleting admin:", error);
        res.status(500).json({ message: 'Server error while deleting admin.' });
    }
};

// @desc    Create a new college
// @route   POST /api/master/colleges
// @access  Private/Master
const createCollege = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Please provide a college name.' });
    }
    try {
        const [existingCollege] = await pool.query('SELECT * FROM colleges WHERE name = ?', [name]);
        if (existingCollege.length > 0) {
            return res.status(400).json({ message: 'A college with this name already exists.' });
        }
        const [result] = await pool.query('INSERT INTO colleges (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error("Error creating college:", error);
        res.status(500).json({ message: 'Server error while creating college.' });
    }
};

module.exports = { 
    createAdmin, 
    getAdmins, 
    deleteAdmin,
    createCollege
};
