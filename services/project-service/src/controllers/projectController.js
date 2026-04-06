const db = require('../config/db');
const redis = require('../config/redis');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateSchemaName } = require('../utils/sanitize');
const { logAction, ACTION_TYPES } = require('../utils/auditLogger');

const API_KEY_CACHE_TTL = 300;
const PROJECT_LIST_CACHE_TTL = 600;
const JWT_SECRET = process.env.JWT_SECRET;

// Localhost / development origins that are always allowed
const DEV_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/\[::1\](:\d+)?$/,
  /^https?:\/\/0\.0\.0\.0(:\d+)?$/,
];

const isDevOrigin = (origin) => {
  if (!origin) return true; // no origin header (server-to-server, curl, etc.)
  return DEV_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
};

// Map HTTP methods to required permissions
const METHOD_PERMISSION_MAP = {
  'GET': 'read',
  'HEAD': 'read',
  'OPTIONS': 'read',
  'POST': 'insert',
  'PUT': 'update',
  'PATCH': 'update',
  'DELETE': 'delete',
};

const getProjectWithRole = async (projectId, userId) => {
  const { rows } = await db.query(
    `SELECT p.*, pm.role FROM projects p
     LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $2
     WHERE p.project_id = $1`,
    [projectId, userId]
  );
  return rows[0] || null;
};

const createProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, data: { errors: errors.array() }, message: 'Validation failed' });
  }
  const { name, description } = req.body;
  const ownerId = req.user.id;
  const schemaName = generateSchemaName();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO projects (owner_id, project_name, project_description, schema_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ownerId, name.trim(), description || null, schemaName]
    );
    const project = rows[0];
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [project.project_id, ownerId]
    );
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    await client.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO web_anon;`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT USAGE, SELECT ON SEQUENCES TO web_anon;`);
    await client.query(`NOTIFY pgrst, 'reload config';`);
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    await client.query('COMMIT');
    await redis.del(`projects:user:${ownerId}`).catch(() => {});
    await logAction({ projectId: project.project_id, actorId: ownerId, actionType: ACTION_TYPES.PROJECT_CREATED, details: { project_name: name, schemaName }, ipAddress: req.ip });
    res.status(201).json({ status: 201, data: project, message: 'Project created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getUserProjects = async (req, res, next) => {
  try {
    const cacheKey = `projects:user:${req.user.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 200, data: JSON.parse(cached), message: 'Projects retrieved successfully' });
    }

    const { rows } = await db.query(
      `SELECT p.*, pm.role, u.name AS owner_name
       FROM projects p
       LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $1
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1 OR pm.user_id IS NOT NULL
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    await redis.set(cacheKey, JSON.stringify(rows), 'EX', PROJECT_LIST_CACHE_TTL);
    res.status(200).json({ status: 200, data: rows, message: 'Projects retrieved successfully' });
  } catch (error) { next(error); }
};

const getProjectDetails = async (req, res, next) => {
  try {
    const project = await getProjectWithRole(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    res.status(200).json({ status: 200, data: project, message: 'Project details retrieved' });
  } catch (error) { next(error); }
};

const updateProject = async (req, res, next) => {
  const { projectId } = req.params;
  const { name, status, description } = req.body;
  const userId = req.user.id;
  try {
    const project = await getProjectWithRole(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    if (project.owner_id !== userId && project.role !== 'admin') {
      return res.status(403).json({ status: 403, data: null, message: 'Permission denied' });
    }
    const fields = [], values = [];
    let idx = 1;
    if (name) { fields.push(`project_name = $${idx++}`); values.push(name.trim()); }
    if (status) { fields.push(`project_status = $${idx++}`); values.push(status.trim()); }
    if (description !== undefined) { fields.push(`project_description = $${idx++}`); values.push(description); }
    if (fields.length === 0) return res.status(400).json({ status: 400, data: null, message: 'No update fields' });
    values.push(projectId);
    const { rows } = await db.query(
      `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE project_id = $${idx} RETURNING *`,
      values
    );
    await redis.del(`projects:user:${userId}`).catch(() => {});
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.PROJECT_UPDATED, details: { name, status, description }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: rows[0], message: 'Project updated' });
  } catch (error) { next(error); }
};

const deleteProject = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    await client.query('BEGIN');
    const project = await getProjectWithRole(projectId, userId);
    if (!project) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Project not found' }); }
    if (project.owner_id !== userId) { await client.query('ROLLBACK'); return res.status(403).json({ status: 403, data: null, message: 'Only owner can delete' }); }
    await client.query(`DROP SCHEMA IF EXISTS "${project.schema_name}" CASCADE`);
    await client.query(`DELETE FROM projects WHERE project_id = $1`, [projectId]);
    await client.query('COMMIT');
    await redis.del(`projects:user:${userId}`, `project_schema:${projectId}`).catch(() => {});
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.PROJECT_DELETED, details: { project_name: project.project_name }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: null, message: 'Project deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

/**
 * Validate a PostgREST API token (JWT or legacy raw key).
 *
 * Security layers:
 *  1. Extract token from Authorization: Bearer or x-api-key header
 *  2. Verify JWT signature (or fall back to DB lookup for legacy keys)
 *  3. Check revocation via Redis → DB
 *  4. Block public schema access unconditionally
 *  5. Validate origin (localhost/dev always allowed, production must match)
 *  6. Enforce per-method permissions (GET=read, POST=insert, PATCH=update, DELETE=delete)
 */
const validateApiKey = async (req, res) => {
  // 1. Extract token — support both Bearer and x-api-key
  const authHeader = req.headers['authorization'] || req.headers['x-original-authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-original-api-key'] || '';
  const token = bearerToken || apiKeyHeader;

  if (!token) {
    return res.status(401).json({ message: 'Missing API token. Provide Authorization: Bearer <token> or x-api-key header.' });
  }

  const origin = req.headers['x-original-origin'] || req.headers['origin'] || '';
  const method = (req.headers['x-original-method'] || req.method || 'GET').toUpperCase();

  try {
    let schemaName, perms, allowedOrigin, keyId;

    // 2. Try JWT verification first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      schemaName = decoded.schema;
      perms = decoded.perms || ['read'];
      allowedOrigin = decoded.origin || null;
      keyId = decoded.kid;
    } catch (jwtErr) {
      // Not a valid JWT — fall back to legacy raw API key lookup
      const cacheKey = `apikey:${token}`;
      let keyData;

      const cached = await redis.get(cacheKey);
      if (cached) {
        keyData = JSON.parse(cached);
      } else {
        const { rows } = await db.query(
          `SELECT a.id, a.origin_url, a.is_active, a.permissions, p.schema_name
           FROM api_keys a
           JOIN projects p ON a.project_id = p.project_id
           WHERE a.api_key = $1`,
          [token]
        );

        if (!rows.length || !rows[0].is_active) {
          return res.status(401).json({ message: 'Invalid or inactive API key' });
        }

        keyData = rows[0];
        await redis.set(cacheKey, JSON.stringify(keyData), 'EX', API_KEY_CACHE_TTL);
      }

      if (!keyData.is_active) {
        return res.status(401).json({ message: 'Invalid or inactive API key' });
      }

      schemaName = keyData.schema_name;
      perms = Array.isArray(keyData.permissions) ? keyData.permissions : ['read'];
      allowedOrigin = keyData.origin_url || null;
      keyId = keyData.id;
    }

    // 3. Check revocation (Redis fast path, then DB)
    if (keyId) {
      const revoked = await redis.get(`revoked_key:${keyId}`);
      if (revoked) {
        return res.status(401).json({ message: 'API key has been revoked' });
      }

      // DB fallback — check is_active
      const { rows: activeCheck } = await db.query(
        'SELECT is_active FROM api_keys WHERE id = $1',
        [keyId]
      );
      if (activeCheck.length > 0 && !activeCheck[0].is_active) {
        await redis.set(`revoked_key:${keyId}`, '1', 'EX', 86400).catch(() => {});
        return res.status(401).json({ message: 'API key has been revoked' });
      }
    }

    // 4. Block public schema access — NEVER allow
    if (!schemaName || schemaName === 'public' || !schemaName.startsWith('proj_')) {
      return res.status(403).json({ message: 'Access denied. Invalid or restricted schema.' });
    }

    // 5. Origin validation
    if (allowedOrigin && allowedOrigin !== '*') {
      // Origin is restricted — check if request origin is allowed
      if (origin && !isDevOrigin(origin)) {
        // Normalize both for comparison (strip trailing slashes)
        const normalizedOrigin = origin.replace(/\/+$/, '').toLowerCase();
        const normalizedAllowed = allowedOrigin.replace(/\/+$/, '').toLowerCase();

        if (normalizedOrigin !== normalizedAllowed) {
          return res.status(403).json({ message: `Origin '${origin}' is not allowed. Expected: '${allowedOrigin}' or localhost.` });
        }
      }
    }

    // 6. Permission enforcement
    const requiredPermission = METHOD_PERMISSION_MAP[method];
    if (requiredPermission && !perms.includes(requiredPermission)) {
      return res.status(403).json({
        message: `Permission denied. This token lacks '${requiredPermission}' access. Token permissions: [${perms.join(', ')}]`
      });
    }

    // Fire-and-forget: update last_used_at
    if (keyId) {
      db.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyId]).catch(e => console.error(e));
    }

    // Return schema + allowed origin to nginx for CORS and PostgREST profile headers
    res.set('X-Schema-Name', schemaName);
    res.set('X-Allowed-Origin', allowedOrigin || '*');
    return res.status(200).send('OK');
  } catch (err) {
    console.error('API Token Validation Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createProject, getUserProjects, getProjectDetails, updateProject, deleteProject, validateApiKey };
