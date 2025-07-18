const express = require('express');
const router = express.Router();
const { protect, master } = require('../middleware/authMiddleware');
const { 
    createAdmin, 
    getAdmins, 
    deleteAdmin,
    createCollege // Import the new function
} = require('../controllers/masterController');

// All routes in this file are protected and require master privileges
router.use(protect, master);

// Routes for managing admins
router.route('/admins').post(createAdmin).get(getAdmins);
router.route('/admins/:id').delete(deleteAdmin);

// ✨ NEW: Route for creating a college
router.post('/colleges', createCollege);

module.exports = router;