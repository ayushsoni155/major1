const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  refreshToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 20,
  message: { status: 429, data: null, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10,
  message: { status: 429, data: null, message: 'Too many OTP requests, try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---- Public routes ----
router.post('/register',    authLimiter, register);
router.post('/verify-otp',  authLimiter, verifyOtp);
router.post('/resend-otp',  otpLimiter,  resendOtp);
router.post('/login',       authLimiter, login);
router.post('/logout',      logout);
router.post('/refresh',     refreshToken);

// ---- Protected routes ----
router.get('/me', protect, getMe);

module.exports = router;
