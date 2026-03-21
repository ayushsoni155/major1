const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// -------------------- REGISTER --------------------
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        data: null,
        message: 'Email and password are required',
      });
    }

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        data: null,
        message: 'User with this email already exists',
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), password_hash, name || null]
    );

    const user = result.rows[0];

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken({ id: user.id });

    res.status(201).json({
      status: 201,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
        },
        access_token,
        refresh_token,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({
      status: 500,
      data: null,
      message: 'Internal server error',
    });
  }
};

// -------------------- LOGIN --------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        data: null,
        message: 'Email and password are required',
      });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        status: 403,
        data: null,
        message: 'Account is deactivated',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken({ id: user.id });

    res.status(200).json({
      status: 200,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        access_token,
        refresh_token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      status: 500,
      data: null,
      message: 'Internal server error',
    });
  }
};

// -------------------- GET ME --------------------
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, avatar_url, is_active, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 200,
      data: result.rows[0],
      message: 'User profile retrieved',
    });
  } catch (error) {
    console.error('[Auth] GetMe error:', error);
    res.status(500).json({
      status: 500,
      data: null,
      message: 'Internal server error',
    });
  }
};

// -------------------- REFRESH TOKEN --------------------
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        status: 400,
        data: null,
        message: 'Refresh token is required',
      });
    }

    const decoded = verifyRefreshToken(refresh_token);

    // Fetch latest user data
    const result = await db.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'User not found or deactivated',
      });
    }

    const user = result.rows[0];
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token = generateAccessToken(tokenPayload);
    const new_refresh_token = generateRefreshToken({ id: user.id });

    res.status(200).json({
      status: 200,
      data: {
        access_token,
        refresh_token: new_refresh_token,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 401,
        data: null,
        message: 'Refresh token has expired, please login again',
      });
    }
    return res.status(401).json({
      status: 401,
      data: null,
      message: 'Invalid refresh token',
    });
  }
};

module.exports = { register, login, getMe, refreshToken };
