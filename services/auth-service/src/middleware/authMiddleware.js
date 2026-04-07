const jwt = require('jsonwebtoken');

/**
 * Middleware: Protect routes using HttpOnly cookie JWT.
 * Reads 'access_token' from signed cookies → decodes → attaches to req.user
 */
const protect = async (req, res, next) => {
  try {
    // Read from HttpOnly cookie (set by auth service on login/verify)
    let token = req.cookies?.access_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'Not authenticated. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name,
      role:  decoded.role || 'user',
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      status: 401,
      data: null,
      message: 'Invalid session. Please log in.',
    });
  }
};

module.exports = { protect };
