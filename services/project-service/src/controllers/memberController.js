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

// INVITE MEMBER
const inviteMember = async (req, res, next) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  const userId = req.user.id;
  if (!email || !role) return res.status(400).json({ status: 400, data: null, message: 'Email and role required.' });
  if (!['admin', 'editor', 'viewer'].includes(role)) return res.status(400).json({ status: 400, data: null, message: 'Invalid role.' });
  try {
    const { rows: userRows } = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!userRows.length) return res.status(404).json({ status: 404, data: null, message: 'User not found.' });
    const targetUserId = userRows[0].id;
    const { rows: existing } = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );
    if (existing.length > 0) return res.status(409).json({ status: 409, data: null, message: 'User is already a member.' });
    const { rows } = await db.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [projectId, targetUserId, role]
    );
    res.status(201).json({ status: 201, data: rows[0], message: 'Member invited.' });
  } catch (err) { next(err); }
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
