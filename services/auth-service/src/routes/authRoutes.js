const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register, verifyOtp, resendOtp, login, logout, getMe, refreshToken,
  updateProfile, changePassword, deleteAccount, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { status: 429, data: null, message: 'Too many requests, please try again later' }, standardHeaders: true, legacyHeaders: false });
const otpLimiter  = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { status: 429, data: null, message: 'Too many OTP requests, try again in an hour' }, standardHeaders: true, legacyHeaders: false });

// ---- Public routes ----
router.post('/register',    authLimiter, register);
router.post('/verify-otp',  authLimiter, verifyOtp);
router.post('/resend-otp',  otpLimiter,  resendOtp);
router.post('/login',       authLimiter, login);
router.post('/logout',      logout);
router.post('/refresh',     refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);

// ---- Protected routes ----
router.get('/me',                    protect, getMe);
router.patch('/profile',             protect, updateProfile);
router.post('/change-password',      protect, changePassword);
router.delete('/account',            protect, deleteAccount);

module.exports = router;
