const express = require('express');
const router = express.Router();
const { sendInvitation, acceptInvitation, declineInvitation, getMyInvitations, getProjectInvitations } = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

router.use(protect);

// My pending invitations
router.get('/invitations/mine', getMyInvitations);

// Accept / decline by token (authenticated)
router.post('/invitations/accept/:token', acceptInvitation);
router.post('/invitations/decline/:token', declineInvitation);

// Per-project: send invite, list pending invites
router.route('/:projectId/invitations')
  .get(checkProjectRole(['admin']), getProjectInvitations)
  .post(checkProjectRole(['admin']), sendInvitation);

module.exports = router;
