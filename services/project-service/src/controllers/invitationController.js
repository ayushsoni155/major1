const db = require('../config/db');
const crypto = require('crypto');
const { sendInviteEmail, sendInviteAcceptedEmail, sendInviteDeclinedEmail, FRONTEND_URL } = require('../utils/mailer');
const { createNotification } = require('./notificationController');

// SEND INVITATION (creates pending invite, sends email, creates notification)
const sendInvitation = async (req, res, next) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  const inviterId = req.user.id;

  if (!email || !role) return res.status(400).json({ status: 400, data: null, message: 'Email and role required.' });
  if (!['admin', 'editor', 'viewer'].includes(role)) return res.status(400).json({ status: 400, data: null, message: 'Invalid role.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Get project details
    const { rows: projectRows } = await client.query('SELECT project_name FROM projects WHERE project_id = $1', [projectId]);
    if (!projectRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Project not found.' }); }
    const project = projectRows[0];

    // Get inviter details
    const { rows: inviterRows } = await client.query('SELECT name, email FROM users WHERE id = $1', [inviterId]);
    const inviter = inviterRows[0];

    // Find invitee by email
    const { rows: userRows } = await client.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!userRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'No RapidBase account found with that email.' }); }
    const invitee = userRows[0];

    // Check if already a member
    const { rows: existing } = await client.query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, invitee.id]);
    if (existing.length) { await client.query('ROLLBACK'); return res.status(409).json({ status: 409, data: null, message: 'User is already a member.' }); }

    // Check if pending invite already exists
    const { rows: pendingInvite } = await client.query(
      `SELECT id FROM project_invitations WHERE project_id = $1 AND invitee_id = $2 AND status = 'pending'`,
      [projectId, invitee.id]
    );
    if (pendingInvite.length) { await client.query('ROLLBACK'); return res.status(409).json({ status: 409, data: null, message: 'A pending invitation already exists for this user.' }); }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation record
    const { rows: inviteRows } = await client.query(
      `INSERT INTO project_invitations (project_id, inviter_id, invitee_email, invitee_id, role, token)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, inviterId, email.toLowerCase(), invitee.id, role, token]
    );

    // Create in-app notification for invitee
    await createNotification(client, {
      userId: invitee.id,
      type: 'member_invite',
      title: `You were invited to "${project.project_name}"`,
      message: `${inviter.name} invited you to join as ${role}.`,
      data: { invitationId: inviteRows[0].id, projectId, projectName: project.project_name, inviterName: inviter.name, role, token }
    });

    await client.query('COMMIT');

    // Send invitation email (outside transaction)
    const acceptUrl = `${FRONTEND_URL}/invite?token=${token}&action=accept`;
    const declineUrl = `${FRONTEND_URL}/invite?token=${token}&action=decline`;
    sendInviteEmail({
      to: invitee.email,
      inviteeName: invitee.name,
      inviterName: inviter.name,
      projectName: project.project_name,
      role,
      acceptUrl,
      declineUrl
    }).catch(err => console.error('[Mailer] Failed to send invite email:', err));

    res.status(201).json({ status: 201, data: inviteRows[0], message: 'Invitation sent successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ACCEPT INVITATION (via token)
const acceptInvitation = async (req, res, next) => {
  const { token } = req.params;
  const userId = req.user?.id;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Find invitation
    const { rows } = await client.query(
      `SELECT pi.*, p.project_name, u.name as inviter_name, u.email as inviter_email,
              ui.name as invitee_name, ui.email as invitee_email
       FROM project_invitations pi
       JOIN projects p ON p.project_id = pi.project_id
       JOIN users u ON u.id = pi.inviter_id
       JOIN users ui ON ui.id = pi.invitee_id
       WHERE pi.token = $1`,
      [token]
    );

    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Invitation not found.' }); }
    const invite = rows[0];

    if (invite.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: `Invitation already ${invite.status}.` }); }
    if (new Date(invite.expires_at) < new Date()) { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: 'Invitation has expired.' }); }

    // Verify the user accepting is the intended invitee
    if (userId && userId !== invite.invitee_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 403, data: null, message: 'This invitation was not sent to you.' });
    }

    // Add to project_members
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [invite.project_id, invite.invitee_id, invite.role]
    );

    // Update invitation status
    await client.query(`UPDATE project_invitations SET status = 'accepted' WHERE id = $1`, [invite.id]);

    // Create notification for the inviter
    await createNotification(client, {
      userId: invite.inviter_id,
      type: 'invite_accepted',
      title: `${invite.invitee_name} accepted your invitation`,
      message: `${invite.invitee_name} joined "${invite.project_name}" as ${invite.role}.`,
      data: { projectId: invite.project_id, projectName: invite.project_name, inviteeName: invite.invitee_name }
    });

    await client.query('COMMIT');

    // Send email to inviter (outside transaction)
    sendInviteAcceptedEmail({
      to: invite.inviter_email,
      ownerName: invite.inviter_name,
      inviteeName: invite.invitee_name,
      projectName: invite.project_name,
      projectUrl: `${FRONTEND_URL}/project/${invite.project_id}/dashboard`
    }).catch(err => console.error('[Mailer] Failed to send accept email:', err));

    res.status(200).json({ status: 200, data: { projectId: invite.project_id, projectName: invite.project_name }, message: 'Invitation accepted. You have been added to the project.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// DECLINE INVITATION (via token)
const declineInvitation = async (req, res, next) => {
  const { token } = req.params;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT pi.*, p.project_name, u.name as inviter_name, u.email as inviter_email,
              ui.name as invitee_name, ui.email as invitee_email
       FROM project_invitations pi
       JOIN projects p ON p.project_id = pi.project_id
       JOIN users u ON u.id = pi.inviter_id
       JOIN users ui ON ui.id = pi.invitee_id
       WHERE pi.token = $1`,
      [token]
    );

    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Invitation not found.' }); }
    const invite = rows[0];

    if (invite.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: `Invitation already ${invite.status}.` }); }

    // Update status
    await client.query(`UPDATE project_invitations SET status = 'declined' WHERE id = $1`, [invite.id]);

    // Notify inviter
    await createNotification(client, {
      userId: invite.inviter_id,
      type: 'invite_declined',
      title: `${invite.invitee_name} declined your invitation`,
      message: `${invite.invitee_name} declined to join "${invite.project_name}".`,
      data: { projectId: invite.project_id, projectName: invite.project_name, inviteeName: invite.invitee_name }
    });

    await client.query('COMMIT');

    // Send email to inviter (outside transaction)
    sendInviteDeclinedEmail({
      to: invite.inviter_email,
      ownerName: invite.inviter_name,
      inviteeName: invite.invitee_name,
      projectName: invite.project_name,
    }).catch(err => console.error('[Mailer] Failed to send decline email:', err));

    res.status(200).json({ status: 200, data: null, message: 'Invitation declined.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET pending invitations for current user
const getMyInvitations = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT pi.*, p.project_name, u.name as inviter_name, u.avatar_url as inviter_avatar
       FROM project_invitations pi
       JOIN projects p ON p.project_id = pi.project_id
       JOIN users u ON u.id = pi.inviter_id
       WHERE pi.invitee_id = $1 AND pi.status = 'pending' AND pi.expires_at > NOW()
       ORDER BY pi.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Invitations retrieved.' });
  } catch (err) { next(err); }
};

// GET pending invitations sent from a project (for members page)
const getProjectInvitations = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT pi.*, ui.name as invitee_name, ui.email as invitee_email
       FROM project_invitations pi
       JOIN users ui ON ui.id = pi.invitee_id
       WHERE pi.project_id = $1 AND pi.status = 'pending'
       ORDER BY pi.created_at DESC`,
      [projectId]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Project invitations retrieved.' });
  } catch (err) { next(err); }
};

module.exports = { sendInvitation, acceptInvitation, declineInvitation, getMyInvitations, getProjectInvitations };
