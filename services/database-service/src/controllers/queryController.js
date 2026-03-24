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

/**
 * Strip SQL comments (-- line comments and /* block comments *\/) and
 * split the input into individual statements by semicolons.
 */
const parseStatements = (rawSql) => {
  // Remove block comments /* ... */
  let sql = rawSql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove line comments -- ...
  sql = sql.replace(/--[^\r\n]*/g, ' ');
  // Split on semicolons, trim, drop empty
  return sql.split(';').map(s => s.trim()).filter(Boolean);
};

// EXECUTE SQL QUERY (supports multi-statement batches)
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

  const statements = parseStatements(query);
  if (statements.length === 0) {
    return res.status(400).json({ status: 400, data: null, message: 'No executable SQL statements found' });
  }

  // Block dangerous operations (check on full query string, uppercased)
  const upperQuery = query.toUpperCase();
  const forbiddenMatch = FORBIDDEN_KEYWORDS.find(kw => upperQuery.includes(kw.toUpperCase()));
  if (forbiddenMatch) {
    return res.status(403).json({ status: 403, data: null, message: `Restricted operation: ${forbiddenMatch}` });
  }

  // BUG-7 FIX: Only block explicit schema-qualified access
  const schemaQualifiedPattern = /\b(public|pg_catalog|information_schema)\s*\.\s*\w+/i;
  if (schemaQualifiedPattern.test(query)) {
    return res.status(403).json({ status: 403, data: null, message: 'Direct system schema access (public.table, pg_catalog.table) is restricted. Use table names directly.' });
  }

  const schemaName = await getProjectSchema(projectId);
  if (!schemaName) {
    return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
  }

  const client = await db.pool.connect();
  const startTime = Date.now();
  try {
    await client.query(`SET search_path TO "${schemaName}";`);

    const results = [];
    let lastSelectRows = null;

    for (const stmt of statements) {
      const stmtUpper = stmt.toUpperCase().trim();
      const result = await client.query(stmt);
      const isSelect = stmtUpper.startsWith('SELECT') || stmtUpper.startsWith('WITH') || stmtUpper.startsWith('RETURNING');
      results.push({
        statement: stmt.length > 80 ? stmt.slice(0, 80) + '…' : stmt,
        command: result.command || 'UNKNOWN',
        rowCount: result.rowCount || 0,
        rows: result.rows || [],
      });
      if (isSelect && result.rows.length > 0) {
        lastSelectRows = result.rows;
      }
    }

    const durationMs = Date.now() - startTime;

    // Determine what to return:
    // - If any statement returned SELECT rows, return those
    // - Otherwise return the multi-statement summary
    const responseData = lastSelectRows
      ? lastSelectRows
      : results.length === 1
        ? { message: 'Query executed successfully', command: results[0].command, rowCount: results[0].rowCount }
        : { message: `${results.length} statements executed successfully`, statements: results.map(r => `${r.command} (${r.rowCount} rows)`) };

    // Save to query history (save original)
    await db.query(
      `INSERT INTO query_history (project_id, user_id, query_text, query_status, execution_time_ms, rows_affected)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, userId, query.trim(), 'success', durationMs, results.reduce((s, r) => s + (r.rowCount || 0), 0)]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_log (project_id, actor_id, action_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
      [projectId, userId, 'QUERY_EXECUTED', JSON.stringify({ statements: statements.length, durationMs }), req.ip]
    );

    res.status(200).json({
      status: 200,
      data: { executionTimeMs: durationMs, data: responseData, statementsExecuted: results.length },
      message: 'Query executed successfully'
    });
  } catch (error) {
    await db.query(
      `INSERT INTO query_history (project_id, user_id, query_text, query_status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, userId, query.trim(), 'failed', error.message]
    ).catch(() => {});

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
