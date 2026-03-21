const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { executeQuery, getQueryHistory, getAuditLogs } = require('../controllers/queryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/execute', [body('query').not().isEmpty().isString()], executeQuery);
router.get('/history', getQueryHistory);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
