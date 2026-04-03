const crypto = require('crypto');
const db = require('../config/db');
const redis = require('../config/redis');
const { logAction, ACTION_TYPES } = require('../utils/auditLogger');

// Generate a secure API key
const generateApiKey = () => {
  const key = crypto.randomBytes(32).toString('hex');
  const prefix = `rb_${key.substring(0, 8)}`;
  return { fullKey: `rb_${key}`, prefix };
};

// CREATE API KEY
const createApiKey = async (req, res, next) => {
  const { projectId } = req.params;
  const { key_name, origin_url, permissions } = req.body;
  const userId = req.user.id;

  if (!key_name) return res.status(400).json({ status: 400, data: null, message: 'Key name is required.' });

  try {
    // Check project access
    const { rows: projectRows } = await db.query(
      `SELECT p.owner_id, pm.role FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $2
       WHERE p.project_id = $1`,
      [projectId, userId]
    );
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { owner_id, role } = projectRows[0];
    if (userId !== owner_id && role !== 'admin') {
      return res.status(403).json({ status: 403, data: null, message: 'Only admin can create API keys.' });
    }

    const { fullKey, prefix } = generateApiKey();
    const { rows } = await db.query(
      `INSERT INTO api_keys (project_id, key_name, api_key, key_prefix, origin_url, permissions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, project_id, key_name, key_prefix, origin_url, permissions, is_active, created_at`,
      [projectId, key_name, fullKey, prefix, origin_url || null, JSON.stringify(permissions || ['read']), userId]
    );

    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.API_KEY_CREATED, details: { key_name, prefix }, ipAddress: req.ip });

    res.status(201).json({
      status: 201,
      data: { ...rows[0], api_key: fullKey },
      message: 'API key created. Save it now — it won\'t be shown again.',
    });
  } catch (err) { next(err); }
};

// GET API KEYS (masked) — BUG-9 FIX: verify user has project access first
const getApiKeys = async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  try {
    // Verify user has access to this project
    const { rows: projectRows } = await db.query(
      `SELECT p.owner_id, pm.role FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $2
       WHERE p.project_id = $1`,
      [projectId, userId]
    );
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { owner_id, role } = projectRows[0];
    if (userId !== owner_id && !['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(403).json({ status: 403, data: null, message: 'Access denied.' });
    }

    const { rows } = await db.query(
      `SELECT id, project_id, key_name, key_prefix, origin_url, permissions, is_active, last_used_at, created_at, expires_at
       FROM api_keys WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );
    res.status(200).json({ status: 200, data: rows, message: 'API keys retrieved.' });
  } catch (err) { next(err); }
};

// DELETE API KEY
const deleteApiKey = async (req, res, next) => {
  const { projectId, keyId } = req.params;
  const userId = req.user.id;
  try {
    const { rows: projectRows } = await db.query(
      `SELECT p.owner_id, pm.role FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $2
       WHERE p.project_id = $1`,
      [projectId, userId]
    );
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { owner_id, role } = projectRows[0];
    if (userId !== owner_id && role !== 'admin') {
      return res.status(403).json({ status: 403, data: null, message: 'Only admin can delete API keys.' });
    }
    // Get the full API key before deleting so we can invalidate the cache
    const { rows: keyRows } = await db.query('SELECT api_key FROM api_keys WHERE id = $1 AND project_id = $2', [keyId, projectId]);
    await db.query('DELETE FROM api_keys WHERE id = $1 AND project_id = $2', [keyId, projectId]);
    // Invalidate the cached API key validation
    if (keyRows.length > 0) {
      await redis.del(`apikey:${keyRows[0].api_key}`).catch(() => {});
    }
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.API_KEY_DELETED, details: { keyId }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: null, message: 'API key deleted.' });
  } catch (err) { next(err); }
};

module.exports = { createApiKey, getApiKeys, deleteApiKey };
