const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 401, data: null, message: 'Missing or invalid authorization token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role || 'user' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ status: 401, data: null, message: 'Token expired' });
    return res.status(401).json({ status: 401, data: null, message: 'Invalid token' });
  }
};

module.exports = { protect };
