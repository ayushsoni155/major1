const db = require('../config/db');

// GET NOTIFICATIONS for current user
const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Notifications retrieved.' });
  } catch (err) { next(err); }
};

// GET UNREAD COUNT
const getUnreadCount = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: { count: parseInt(rows[0].count) }, message: 'Count retrieved.' });
  } catch (err) { next(err); }
};

// MARK ONE AS READ
const markAsRead = async (req, res, next) => {
  const { notificationId } = req.params;
  try {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, req.user.id]
    );
    res.status(200).json({ status: 200, data: null, message: 'Marked as read.' });
  } catch (err) { next(err); }
};

// MARK ALL AS READ
const markAllRead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: null, message: 'All marked as read.' });
  } catch (err) { next(err); }
};

// Helper: create a notification record (used internally)
const createNotification = async (client, { userId, type, title, message, data }) => {
  await client.query(
    `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, message || null, JSON.stringify(data || {})]
  );
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllRead, createNotification };
