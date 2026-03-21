const db = require('../config/db');
const redis = require('../config/redis');

const FORBIDDEN_KEYWORDS = [
  'DROP SCHEMA', 'CREATE SCHEMA', 'ALTER SCHEMA', 'DROP DATABASE', 'CREATE DATABASE',
  'ALTER DATABASE', 'DROP ROLE', 'CREATE ROLE', 'ALTER ROLE', 'GRANT', 'REVOKE',
  'SET SCHEMA', 'SET ROLE', 'SET SESSION AUTHORIZATION', 'DROP USER', 'CREATE USER',
  'DELETE FROM public.', 'TRUNCATE public.', 'DROP TABLE public.', 'ALTER USER', 'ALTER SYSTEM'
];

const getProjectSchema = async (projectId) => {
  // Try cache first
  const cached = await redis.get(`project_schema:${projectId}`);
  if (cached) return cached;

  const { rows } = await db.query('SELECT schema_name FROM projects WHERE project_id = $1', [projectId]);
  if (rows.length === 0) return null;

  // Cache for 10 minutes
  await redis.set(`project_schema:${projectId}`, rows[0].schema_name, 'EX', 600);
  return rows[0].schema_name;
};

// EXECUTE SQL QUERY
const executeQuery = async (req, res, next) => {
  const { query } = req.body;
  const userId = req.user.id;
  const projectId = req.headers['x-project-id'];

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ status: 400, data: null, message: 'SQL query is required' });
  }
  if (!projectId) {
    return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID header required' });
  }

  const sanitizedQuery = query.trim();
  const upperQuery = sanitizedQuery.toUpperCase();

  // Block dangerous operations
  const forbiddenMatch = FORBIDDEN_KEYWORDS.find(kw => upperQuery.includes(kw));
  if (forbiddenMatch) {
    return res.status(403).json({ status: 403, data: null, message: `Restricted operation: ${forbiddenMatch}` });
  }

  // Prevent system schema access
  if (/\b(public|pg_catalog|information_schema)\b/gi.test(upperQuery)) {
    return res.status(403).json({ status: 403, data: null, message: 'System schema access restricted' });
  }

  const schemaName = await getProjectSchema(projectId);
  if (!schemaName) {
    return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
  }

  const client = await db.pool.connect();
  try {
    await client.query(`SET search_path TO "${schemaName}";`);
    const startTime = Date.now();
    const result = await client.query(sanitizedQuery);
    const durationMs = Date.now() - startTime;

    const responseData = result.rows.length > 0
      ? result.rows
      : { message: 'Query executed successfully', rowCount: result.rowCount };

    // Save to query history
    await db.query(
      `INSERT INTO query_history (project_id, user_id, query_text, query_status, execution_time_ms, rows_affected)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, userId, sanitizedQuery, 'success', durationMs, result.rowCount || 0]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_log (project_id, actor_id, action_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
      [projectId, userId, 'QUERY_EXECUTED', JSON.stringify({ query: sanitizedQuery, durationMs, affectedRows: result.rowCount }), req.ip]
    );

    res.status(200).json({
      status: 200,
      data: { executionTimeMs: durationMs, data: responseData },
      message: 'Query executed successfully'
    });
  } catch (error) {
    // Save failed query
    await db.query(
      `INSERT INTO query_history (project_id, user_id, query_text, query_status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, userId, sanitizedQuery, 'failed', error.message]
    );

    res.status(400).json({ status: 400, data: { error: error.message }, message: 'Error executing query' });
  } finally {
    client.release();
  }
};

// GET QUERY HISTORY
const getQueryHistory = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID header required' });

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM query_history WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    const { rows } = await db.query(
      `SELECT id, query_text, query_status, execution_time_ms, rows_affected, error_message, created_at
       FROM query_history WHERE project_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [projectId, userId, parseInt(limit), offset]
    );
    res.status(200).json({
      status: 200,
      data: { history: rows, total: parseInt(countResult.rows[0].total), page: parseInt(page) },
      message: 'Query history retrieved'
    });
  } catch (err) { next(err); }
};

// GET AUDIT LOGS
const getAuditLogs = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const { page = 1, limit = 50 } = req.query;

  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID header required' });

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await db.query(
      `SELECT al.id, al.actor_id, al.action_type, al.details, al.ip_address, al.created_at, u.email as actor_email, u.name as actor_name
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.actor_id
       WHERE al.project_id = $1
       ORDER BY al.created_at DESC LIMIT $2 OFFSET $3`,
      [projectId, parseInt(limit), offset]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Audit logs retrieved' });
  } catch (err) { next(err); }
};

module.exports = { executeQuery, getQueryHistory, getAuditLogs };
