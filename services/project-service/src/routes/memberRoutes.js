const express = require('express');
const router = express.Router();
const { getMembers, inviteMember, updateMemberRole, removeMember } = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

router.use(protect);

router.route('/:projectId/members')
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getMembers)
  .post(checkProjectRole(['admin']), inviteMember);

router.route('/:projectId/members/:memberId')
  .patch(checkProjectRole(['admin']), updateMemberRole)
  .delete(checkProjectRole(['admin']), removeMember);

module.exports = router;
