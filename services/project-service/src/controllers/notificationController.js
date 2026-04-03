const db = require('../config/db');
const redis = require('../config/redis');
const Redis = require('ioredis');

// ---- Redis Pub/Sub ----
// We need a SEPARATE Redis client for subscribing (ioredis requirement:
// a client in subscriber mode cannot run other commands).
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redisSub.on('error', (err) => console.error('[Notifications] Redis sub error:', err.message));

// ---- Constants ----
const UNREAD_KEY_PREFIX = 'notifications:unread:';
const CHANNEL_PREFIX    = 'notify:user:';
const SSE_KEEPALIVE_MS  = 25_000; // 25s ping to prevent proxy timeout

// ============================================================
// Helper: Unread count cache
// ============================================================

/** Get cached unread count, or compute from DB and cache it */
const getUnreadCountCached = async (userId) => {
  const key = `${UNREAD_KEY_PREFIX}${userId}`;
  const cached = await redis.get(key);
  if (cached !== null) return parseInt(cached, 10);

  // Cache miss — compute from DB
  const { rows } = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  const count = parseInt(rows[0].count, 10);
  await redis.set(key, count, 'EX', 3600); // cache for 1h, gets invalidated on changes
  return count;
};

// ============================================================
// GET NOTIFICATIONS for current user
// ============================================================
const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Notifications retrieved.' });
  } catch (err) { next(err); }
};

// ============================================================
// GET UNREAD COUNT (cached in Redis)
// ============================================================
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await getUnreadCountCached(req.user.id);
    res.status(200).json({ status: 200, data: { count }, message: 'Count retrieved.' });
  } catch (err) { next(err); }
};

// ============================================================
// MARK ONE AS READ
// ============================================================
const markAsRead = async (req, res, next) => {
  const { notificationId } = req.params;
  try {
    const { rowCount } = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 AND is_read = false`,
      [notificationId, req.user.id]
    );
    // Decrement cached unread count
    if (rowCount > 0) {
      const key = `${UNREAD_KEY_PREFIX}${req.user.id}`;
      const current = await redis.get(key);
      if (current !== null && parseInt(current, 10) > 0) {
        await redis.decr(key);
      }
    }
    res.status(200).json({ status: 200, data: null, message: 'Marked as read.' });
  } catch (err) { next(err); }
};

// ============================================================
// MARK ALL AS READ
// ============================================================
const markAllRead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.id]
    );
    // Reset cached unread count
    await redis.set(`${UNREAD_KEY_PREFIX}${req.user.id}`, 0, 'EX', 3600);
    res.status(200).json({ status: 200, data: null, message: 'All marked as read.' });
  } catch (err) { next(err); }
};

// ============================================================
// Helper: Create notification + publish to Redis Pub/Sub
// ============================================================
const createNotification = async (client, { userId, type, title, message, data }) => {
  // 1. Persist to DB (durable storage for history)
  const { rows } = await client.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message || null, JSON.stringify(data || {})]
  );

  const notification = rows[0];

  // 2. Increment cached unread count
  const unreadKey = `${UNREAD_KEY_PREFIX}${userId}`;
  const exists = await redis.exists(unreadKey);
  if (exists) {
    await redis.incr(unreadKey);
  }

  // 3. Publish real-time event via Redis Pub/Sub
  const channel = `${CHANNEL_PREFIX}${userId}`;
  const payload = JSON.stringify({
    event: 'new_notification',
    data: notification,
  });
  await redis.publish(channel, payload).catch((err) =>
    console.error('[Notifications] Pub/Sub publish error:', err.message)
  );
};

// ============================================================
// SSE STREAM — real-time notifications via Server-Sent Events
// ============================================================
const streamNotifications = async (req, res) => {
  const userId = req.user.id;
  const channel = `${CHANNEL_PREFIX}${userId}`;

  // ---- SSE Headers ----
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx: disable buffering
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true',
  });

  // ---- Send initial unread count ----
  const unreadCount = await getUnreadCountCached(userId);
  res.write(`event: unread_count\ndata: ${JSON.stringify({ count: unreadCount })}\n\n`);

  // ---- Subscribe to user's notification channel ----
  const onMessage = (ch, message) => {
    if (ch === channel) {
      try {
        const parsed = JSON.parse(message);
        res.write(`event: notification\ndata: ${JSON.stringify(parsed.data)}\n\n`);
      } catch (err) {
        console.error('[SSE] Failed to parse message:', err.message);
      }
    }
  };

  redisSub.subscribe(channel, (err) => {
    if (err) {
      console.error('[SSE] Subscribe error:', err.message);
      res.end();
      return;
    }
    console.log(`[SSE] User ${userId} subscribed to ${channel}`);
  });

  redisSub.on('message', onMessage);

  // ---- Keepalive ping to prevent proxy/client timeout ----
  const keepalive = setInterval(() => {
    res.write(`:keepalive\n\n`);
  }, SSE_KEEPALIVE_MS);

  // ---- Cleanup on client disconnect ----
  req.on('close', () => {
    clearInterval(keepalive);
    redisSub.unsubscribe(channel).catch(() => {});
    redisSub.removeListener('message', onMessage);
    console.log(`[SSE] User ${userId} disconnected from ${channel}`);
  });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  createNotification,
  streamNotifications,
};
