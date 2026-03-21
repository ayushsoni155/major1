const express = require('express');
const router = express.Router();
const { getSchemaStructure } = require('../controllers/schemaController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/:projectId', getSchemaStructure);

module.exports = router;
