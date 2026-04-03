const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const redis = require('../config/redis');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/mailer');

// ---- Cookie config ----
const isHttps = process.env.FRONTEND_URL?.startsWith('https://');
const COOKIE_OPTS = {
  httpOnly: true,
  secure: isHttps ? true : false,
  sameSite: 'lax',
  path: '/',
};
const ACCESS_COOKIE_MAX_AGE  = 15 * 60 * 1000;        // 15 minutes
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---- Redis key helpers ----
const OTP_TTL      = 600; // 10 minutes
const COOLDOWN_TTL = 60;  // 60 seconds
const MAX_ATTEMPTS = 5;

const otpKey      = (email) => `otp:${email}:code`;
const attemptsKey = (email) => `otp:${email}:attempts`;
const cooldownKey = (email) => `otp:${email}:cooldown`;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token',  { ...COOKIE_OPTS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTS });
}

/** Generate a cryptographically random 6-digit OTP */
function generateOtp() {
  return String(Math.floor(100000 + crypto.randomInt(0, 900000))).padStart(6, '0');
}

/** Store OTP in Redis with TTL + set cooldown */
async function storeOtpInRedis(email, otp) {
  const pipeline = redis.pipeline();
  pipeline.set(otpKey(email), otp, 'EX', OTP_TTL);
  pipeline.del(attemptsKey(email)); // reset attempts on new OTP
  pipeline.set(cooldownKey(email), '1', 'EX', COOLDOWN_TTL);
  await pipeline.exec();
}

/** Verify OTP from Redis. Returns { valid, error, statusCode } */
async function verifyOtpFromRedis(email) {
  // Check attempt limit
  const attempts = parseInt(await redis.get(attemptsKey(email)) || '0', 10);
  if (attempts >= MAX_ATTEMPTS) {
    return { valid: false, statusCode: 429, error: 'Too many attempts. Please request a new code.' };
  }

  // Check if OTP exists (implicitly checks expiry via Redis TTL)
  const storedOtp = await redis.get(otpKey(email));
  if (!storedOtp) {
    return { valid: false, statusCode: 400, error: 'OTP has expired or was not requested. Please request a new code.' };
  }

  return { valid: true, storedOtp };
}

/** Increment attempts counter in Redis */
async function incrementAttempts(email) {
  const pipeline = redis.pipeline();
  pipeline.incr(attemptsKey(email));
  // Ensure the attempts key also expires (in case it was created fresh)
  pipeline.expire(attemptsKey(email), OTP_TTL);
  await pipeline.exec();
}

/** Clear all OTP keys for an email */
async function clearOtpFromRedis(email) {
  await redis.del(otpKey(email), attemptsKey(email), cooldownKey(email));
}

// ============================================================
// REGISTER — creates unverified user, sends OTP email
// ============================================================
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 400, data: null, message: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: 400, data: null, message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing verified account
    const existing = await db.query(
      'SELECT id, is_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      if (existingUser.is_verified) {
        return res.status(409).json({ status: 409, data: null, message: 'An account with this email already exists' });
      }
      // Re-send OTP for unverified account → store in Redis
      const otp = generateOtp();
      await storeOtpInRedis(normalizedEmail, otp);
      await sendOtpEmail(normalizedEmail, otp, name || 'there');
      return res.status(200).json({
        status: 200,
        data: { email: normalizedEmail },
        message: 'Verification code resent. Please check your email.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate OTP → store in Redis
    const otp = generateOtp();

    // Insert unverified user (no OTP columns in DB anymore)
    await db.query(
      `INSERT INTO users (email, password_hash, name, is_verified)
       VALUES ($1, $2, $3, false)`,
      [normalizedEmail, password_hash, name || null]
    );

    // Store OTP in Redis
    await storeOtpInRedis(normalizedEmail, otp);

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp, name || 'there');

    return res.status(201).json({
      status: 201,
      data: { email: normalizedEmail },
      message: 'Account created! Please check your email for the verification code.',
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// VERIFY OTP — marks user verified, sets cookie session
// ============================================================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 400, data: null, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await db.query(
      'SELECT id, email, name, role, is_active FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 404, data: null, message: 'User not found' });
    }

    const user = result.rows[0];

    // Verify OTP from Redis
    const otpCheck = await verifyOtpFromRedis(normalizedEmail);
    if (!otpCheck.valid) {
      return res.status(otpCheck.statusCode).json({ status: otpCheck.statusCode, data: null, message: otpCheck.error });
    }

    // Increment attempt counter regardless
    await incrementAttempts(normalizedEmail);

    // Constant-time comparison to prevent timing attacks
    const providedOtp = String(otp).trim();
    const storedOtp   = String(otpCheck.storedOtp).trim();
    const match = crypto.timingSafeEqual(
      Buffer.from(providedOtp.padEnd(6, ' ')),
      Buffer.from(storedOtp.padEnd(6,  ' '))
    );

    if (!match) {
      return res.status(400).json({ status: 400, data: null, message: 'Invalid verification code' });
    }

    // Mark user as verified in DB, clear OTP from Redis
    await db.query(
      `UPDATE users SET is_verified=true, last_login=NOW() WHERE id=$1`,
      [user.id]
    );
    await clearOtpFromRedis(normalizedEmail);

    // Issue tokens → set HttpOnly cookies
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token  = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken({ id: user.id });
    setAuthCookies(res, access_token, refresh_token);

    return res.status(200).json({
      status: 200,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      message: 'Email verified successfully! Welcome to RapidBase.',
    });
  } catch (error) {
    console.error('[Auth] VerifyOTP error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// RESEND OTP
// ============================================================
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 400, data: null, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT id, name, is_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 404, data: null, message: 'User not found' });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.status(400).json({ status: 400, data: null, message: 'Account already verified' });
    }

    // Cooldown check via Redis
    const onCooldown = await redis.exists(cooldownKey(normalizedEmail));
    if (onCooldown) {
      const ttl = await redis.ttl(cooldownKey(normalizedEmail));
      return res.status(429).json({
        status: 429, data: null,
        message: `Please wait ${ttl > 0 ? ttl : 1} seconds before requesting a new code`,
      });
    }

    const otp = generateOtp();
    await storeOtpInRedis(normalizedEmail, otp);
    await sendOtpEmail(normalizedEmail, otp, user.name || 'there');

    return res.status(200).json({ status: 200, data: null, message: 'New verification code sent to your email' });
  } catch (error) {
    console.error('[Auth] ResendOTP error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// LOGIN — validates credentials, sets cookie session
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 400, data: null, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT id, email, password_hash, name, role, is_active, is_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 401, data: null, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ status: 403, data: null, message: 'Account is deactivated' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        status: 403,
        data: { email: normalizedEmail, requiresVerification: true },
        message: 'Please verify your email before logging in',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 401, data: null, message: 'Invalid email or password' });
    }

    await db.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token  = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken({ id: user.id });
    setAuthCookies(res, access_token, refresh_token);

    return res.status(200).json({
      status: 200,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// LOGOUT — clears cookies
// ============================================================
const logout = (req, res) => {
  clearAuthCookies(res);
  return res.status(200).json({ status: 200, data: null, message: 'Logged out successfully' });
};

// ============================================================
// UPDATE PROFILE — name and/or avatar_url
// ============================================================
const updateProfile = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    if (!name && !avatar_url) {
      return res.status(400).json({ status: 400, data: null, message: 'Nothing to update.' });
    }
    const fields = [], values = [];
    let idx = 1;
    if (name) { fields.push(`name = $${idx++}`); values.push(name.trim()); }
    if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(avatar_url); }
    values.push(req.user.id);
    const { rows } = await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, email, name, avatar_url, role, created_at`,
      values
    );
    return res.status(200).json({ status: 200, data: rows[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[Auth] UpdateProfile error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 400, data: null, message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ status: 400, data: null, message: 'New password must be at least 8 characters.' });
    }
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ status: 404, data: null, message: 'User not found.' });
    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) return res.status(401).json({ status: 401, data: null, message: 'Current password is incorrect.' });
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    return res.status(200).json({ status: 200, data: null, message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    console.error('[Auth] ChangePassword error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// DELETE ACCOUNT
// ============================================================
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ status: 400, data: null, message: 'Password required to confirm account deletion.' });
    }
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ status: 404, data: null, message: 'User not found.' });
    const isValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isValid) return res.status(401).json({ status: 401, data: null, message: 'Incorrect password.' });
    // Deactivate instead of hard-delete to preserve audit trail
    await db.query('UPDATE users SET is_active = false, email = CONCAT(email, $1), updated_at = NOW() WHERE id = $2', [`_deleted_${req.user.id}`, req.user.id]);
    clearAuthCookies(res);
    return res.status(200).json({ status: 200, data: null, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('[Auth] DeleteAccount error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};


// ============================================================
// GET ME — reads user from cookie JWT
// ============================================================
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, avatar_url, is_active, last_login, created_at FROM users WHERE id=$1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 404, data: null, message: 'User not found' });
    }

    return res.status(200).json({ status: 200, data: result.rows[0], message: 'User profile retrieved' });
  } catch (error) {
    console.error('[Auth] GetMe error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// FORGOT PASSWORD — sends OTP email for password reset
// ============================================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 400, data: null, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT id, name, is_verified, is_active FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.status(200).json({ status: 200, data: { email: normalizedEmail }, message: 'If an account exists with this email, a reset code has been sent.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(200).json({ status: 200, data: { email: normalizedEmail }, message: 'If an account exists with this email, a reset code has been sent.' });
    }

    if (!user.is_verified) {
      return res.status(400).json({ status: 400, data: { email: normalizedEmail, requiresVerification: true }, message: 'Please verify your email first before resetting password.' });
    }

    // Cooldown check via Redis
    const onCooldown = await redis.exists(cooldownKey(normalizedEmail));
    if (onCooldown) {
      const ttl = await redis.ttl(cooldownKey(normalizedEmail));
      return res.status(429).json({
        status: 429, data: null,
        message: `Please wait ${ttl > 0 ? ttl : 1} seconds before requesting a new code`,
      });
    }

    const otp = generateOtp();
    await storeOtpInRedis(normalizedEmail, otp);
    await sendPasswordResetEmail(normalizedEmail, otp, user.name || 'there');

    return res.status(200).json({ status: 200, data: { email: normalizedEmail }, message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (error) {
    console.error('[Auth] ForgotPassword error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// RESET PASSWORD — verifies OTP and sets new password
// ============================================================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: 400, data: null, message: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ status: 400, data: null, message: 'New password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT id, is_active, is_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 404, data: null, message: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active || !user.is_verified) {
      return res.status(400).json({ status: 400, data: null, message: 'Account is not active or not verified' });
    }

    // Verify OTP from Redis
    const otpCheck = await verifyOtpFromRedis(normalizedEmail);
    if (!otpCheck.valid) {
      return res.status(otpCheck.statusCode).json({ status: otpCheck.statusCode, data: null, message: otpCheck.error });
    }

    // Increment attempt counter
    await incrementAttempts(normalizedEmail);

    // Constant-time comparison
    const providedOtp = String(otp).trim();
    const storedOtp   = String(otpCheck.storedOtp).trim();
    const match = crypto.timingSafeEqual(
      Buffer.from(providedOtp.padEnd(6, ' ')),
      Buffer.from(storedOtp.padEnd(6, ' '))
    );

    if (!match) {
      return res.status(400).json({ status: 400, data: null, message: 'Invalid reset code' });
    }

    // Hash new password and update in DB
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await db.query(
      `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2`,
      [password_hash, user.id]
    );

    // Clear OTP from Redis
    await clearOtpFromRedis(normalizedEmail);

    return res.status(200).json({ status: 200, data: null, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[Auth] ResetPassword error:', error);
    res.status(500).json({ status: 500, data: null, message: 'Internal server error' });
  }
};

// ============================================================
// REFRESH TOKEN — rotates tokens via cookie
// ============================================================
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (!token) {
      return res.status(401).json({ status: 401, data: null, message: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(token);

    const result = await db.query(
      'SELECT id, email, name, role FROM users WHERE id=$1 AND is_active=true AND is_verified=true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      clearAuthCookies(res);
      return res.status(401).json({ status: 401, data: null, message: 'User not found or deactivated' });
    }

    const user = result.rows[0];
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const access_token  = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken({ id: user.id });
    setAuthCookies(res, access_token, refresh_token);

    return res.status(200).json({ status: 200, data: { user }, message: 'Token refreshed' });
  } catch (error) {
    clearAuthCookies(res);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 401, data: null, message: 'Session expired, please login again' });
    }
    return res.status(401).json({ status: 401, data: null, message: 'Invalid session' });
  }
};

module.exports = { register, verifyOtp, resendOtp, login, logout, getMe, refreshToken, updateProfile, changePassword, deleteAccount, forgotPassword, resetPassword };
