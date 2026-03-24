const db = require('../config/db');

// GET MEMBERS
const getMembers = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT pm.id, pm.user_id, pm.role, pm.invited_at, u.email, u.name, u.avatar_url
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.invited_at`,
      [projectId]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Members retrieved.' });
  } catch (err) { next(err); }
};

// INVITE MEMBER — delegates to the invitation flow (pending invite + email notification)
const inviteMember = async (req, res, next) => {
  // Forward to sendInvitation which handles the full invitation workflow
  const { sendInvitation } = require('./invitationController');
  return sendInvitation(req, res, next);
};

// UPDATE MEMBER ROLE
const updateMemberRole = async (req, res, next) => {
  const { projectId, memberId } = req.params;
  const { role } = req.body;
  if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ status: 400, data: null, message: 'Valid role required.' });
  }
  try {
    const { rows } = await db.query(
      `UPDATE project_members SET role = $1 WHERE id = $2 AND project_id = $3 RETURNING *`,
      [role, memberId, projectId]
    );
    if (!rows.length) return res.status(404).json({ status: 404, data: null, message: 'Member not found.' });
    res.status(200).json({ status: 200, data: rows[0], message: 'Member role updated.' });
  } catch (err) { next(err); }
};

// REMOVE MEMBER
const removeMember = async (req, res, next) => {
  const { projectId, memberId } = req.params;
  try {
    await db.query('DELETE FROM project_members WHERE id = $1 AND project_id = $2', [memberId, projectId]);
    res.status(200).json({ status: 200, data: null, message: 'Member removed.' });
  } catch (err) { next(err); }
};

module.exports = { getMembers, inviteMember, updateMemberRole, removeMember };
