const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ✨ FIX: Fetch the college_id along with other user details.
      // This makes the user's college available in all protected routes.
      const [rows] = await pool.query(
          'SELECT id, name, email, role, college_id FROM users WHERE id = ?', 
          [decoded.id]
      );

      if (rows.length > 0) {
        req.user = rows[0];
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, user not found' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// ✨ NEW: Middleware to protect master-only routes
const master = (req, res, next) => {
  if (req.user && req.user.role === 'master') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a master user' });
  }
};

module.exports = { protect, admin, master };
