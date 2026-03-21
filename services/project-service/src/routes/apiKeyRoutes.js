const express = require('express');
const router = express.Router();
const { createApiKey, getApiKeys, deleteApiKey } = require('../controllers/apiKeyController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

router.use(protect);

router.route('/:projectId/keys')
  .post(checkProjectRole(['admin']), createApiKey)
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getApiKeys);

router.route('/:projectId/keys/:keyId')
  .delete(checkProjectRole(['admin']), deleteApiKey);

module.exports = router;
