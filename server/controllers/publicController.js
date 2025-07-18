const pool = require('../config/db');

// @desc    Get a list of all colleges
// @route   GET /api/public/colleges
// @access  Public
const getColleges = async (req, res) => {
    try {
        const [colleges] = await pool.query("SELECT id, name FROM colleges ORDER BY name ASC");
        res.json(colleges);
    } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getColleges };