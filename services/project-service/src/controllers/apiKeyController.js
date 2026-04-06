const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const redis = require('../config/redis');
const { logAction, ACTION_TYPES } = require('../utils/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_PERMISSIONS = ['read', 'insert', 'update', 'delete'];

const createApiKey = async (req, res, next) => {
  const { projectId } = req.params;
  const { key_name, origin_url, permissions } = req.body;
  const userId = req.user.id;

  if (!key_name) return res.status(400).json({ status: 400, data: null, message: 'Key name is required.' });

  try {
    const { rows: projectRows } = await db.query(
      `SELECT p.project_id, p.schema_name, p.owner_id, pm.role FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $2
       WHERE p.project_id = $1`,
      [projectId, userId]
    );
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { owner_id, role, schema_name } = projectRows[0];
    if (userId !== owner_id && role !== 'admin') {
      return res.status(403).json({ status: 403, data: null, message: 'Only admin can create API keys.' });
    }

    // Validate and normalize permissions
    const perms = Array.isArray(permissions) && permissions.length > 0
      ? permissions.filter(p => VALID_PERMISSIONS.includes(p))
      : ['read'];

    if (perms.length === 0) {
      return res.status(400).json({ status: 400, data: null, message: `Invalid permissions. Valid: ${VALID_PERMISSIONS.join(', ')}` });
    }

    // Generate a unique key ID for revocation tracking
    const keyId = crypto.randomUUID();

    // Sign a JWT token containing all access info
    const tokenPayload = {
      kid: keyId,
      pid: projectId,
      schema: schema_name,
      perms,
      origin: origin_url || null,
    };

    const fullKey = jwt.sign(tokenPayload, JWT_SECRET);
    const prefix = `rb_${keyId.substring(0, 8)}`;

    const { rows } = await db.query(
      `INSERT INTO api_keys (id, project_id, key_name, api_key, key_prefix, origin_url, permissions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, project_id, key_name, key_prefix, origin_url, permissions, is_active, created_at`,
      [keyId, projectId, key_name, fullKey, prefix, origin_url || null, JSON.stringify(perms), userId]
    );

    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.API_KEY_CREATED, details: { key_name, prefix }, ipAddress: req.ip });

    res.status(201).json({
      status: 201,
      data: { ...rows[0], api_key: fullKey },
      message: 'API key created. Save it now — it won\'t be shown again.',
    });
  } catch (err) { next(err); }
};

const getApiKeys = async (req, res, next) => {
  const { projectId } = req.params;
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

    const { rows: keyRows } = await db.query('SELECT id, api_key FROM api_keys WHERE id = $1 AND project_id = $2', [keyId, projectId]);
    await db.query('DELETE FROM api_keys WHERE id = $1 AND project_id = $2', [keyId, projectId]);

    if (keyRows.length > 0) {
      // Invalidate both the old cache key and mark the key as revoked
      await redis.del(`apikey:${keyRows[0].api_key}`).catch(() => {});
      await redis.set(`revoked_key:${keyRows[0].id}`, '1', 'EX', 86400).catch(() => {});
    }
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.API_KEY_DELETED, details: { keyId }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: null, message: 'API key deleted.' });
  } catch (err) { next(err); }
};

module.exports = { createApiKey, getApiKeys, deleteApiKey };
