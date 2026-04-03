const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadCount, markAsRead, markAllRead, streamNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// SSE stream — must be before any wildcard routes
router.get('/notifications/stream', streamNotifications);

router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/mark-all-read', markAllRead);
router.patch('/notifications/:notificationId/read', markAsRead);

module.exports = router;
