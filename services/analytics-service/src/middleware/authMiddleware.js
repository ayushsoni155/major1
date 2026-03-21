const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ status: 401, data: null, message: 'Missing token' });
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role || 'user' };
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, data: null, message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};
module.exports = { protect };
