const express = require('express');
const router = express.Router();
const { getTables, getTableColumns, getChartData, getTableStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/tables', getTables);
router.get('/tables/:tableName/columns', getTableColumns);
router.get('/chart', getChartData);
router.get('/stats', getTableStats);

module.exports = router;
