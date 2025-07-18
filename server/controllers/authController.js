const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ✨ FIX: The token now includes the user's name and role for use on the frontend.
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, college_id } = req.body;
  if (!name || !email || !password || !college_id) {
    return res.status(400).json({ message: 'Please provide all fields, including college.' });
  }
  try {
    const [userExists] = await pool.query('SELECT * FROM users WHERE email = ? AND college_id = ?', [email, college_id]);
    if (userExists.length > 0) {
        return res.status(400).json({ message: 'A user with this email already exists at this college.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.query(
      'INSERT INTO users (name, email, password, role, status, college_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'student', 'pending', college_id]
    );
    res.status(201).json({ message: 'Registration successful! Your account is now pending approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user (login)
const loginUser = async (req, res) => {
  const { email, password, college_id } = req.body;

  try {
    let users;
    // ✨ FIX: If the email is for a master user, search without a college_id.
    // This assumes master user emails are unique across the entire system.
    const [potentialMaster] = await pool.query("SELECT * FROM users WHERE email = ? AND role = 'master'", [email]);
    
    if (potentialMaster.length > 0) {
        users = potentialMaster;
    } else {
        // For admins and students, college_id is required.
        if (!college_id) {
            return res.status(400).json({ message: 'Please select a college.' });
        }
        [users] = await pool.query('SELECT * FROM users WHERE email = ? AND college_id = ?', [email, college_id]);
    }

    if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials for the selected college.' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      if (user.role === 'student' && user.status !== 'approved') {
        return res.status(403).json({ message: 'Your account is still pending approval.' });
      }
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user) });
    } else {
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { registerUser, loginUser };
