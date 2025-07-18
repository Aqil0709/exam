const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// This route is protected to prevent abuse of the compiler API
router.post('/run', protect, async (req, res) => {
    const { language, code } = req.body;

    try {
        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: code,
            language: language,
            versionIndex: '0' // Use latest version
        });
        res.json(response.data);
    } catch (error) {
        console.error("JDoodle API Error:", error.response?.data);
        res.status(500).json({ message: 'Error executing code', error: error.response?.data });
    }
});

module.exports = router;