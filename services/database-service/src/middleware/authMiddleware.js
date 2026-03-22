const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ status: 401, data: null, message: 'Not authenticated. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role || 'user' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 401, data: null, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ status: 401, data: null, message: 'Invalid session. Please log in.' });
  }
};

module.exports = { protect };
