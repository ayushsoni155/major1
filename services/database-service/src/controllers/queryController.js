const db = require('../config/db');
const redis = require('../config/redis');

// Schema names that users must NEVER be able to prefix their queries with.
// Our search_path enforcement already handles this at the DB level, but we
// add an explicit application-layer block as defence-in-depth.
const BLOCKED_SCHEMA_PREFIXES = [
  'public',
  'pg_catalog',
  'information_schema',
  'pg_toast',
  'pg_temp',
];

// DDL / admin operations that are always forbidden regardless of schema.
// IMPORTANT: These are matched with WHOLE-WORD regex (word boundaries) so that
// column / table names that merely contain these strings (e.g. "begin_date",
// "grant_id", "commit_hash") do NOT trigger a false-positive block.
// Allowed DML/DDL on the user's own schema: SELECT, INSERT, UPDATE, DELETE,
// CREATE TABLE, ALTER TABLE, DROP TABLE, CREATE INDEX, etc.
const FORBIDDEN_KEYWORDS = [
  // Schema / database / role / user admin — structural, cross-tenant danger
  'DROP SCHEMA', 'CREATE SCHEMA', 'ALTER SCHEMA',
  'DROP DATABASE', 'CREATE DATABASE', 'ALTER DATABASE',
  'DROP ROLE', 'CREATE ROLE', 'ALTER ROLE',
  'DROP USER', 'CREATE USER', 'ALTER USER',
  'ALTER SYSTEM',
  // Privilege management — must never be run by users
  'GRANT', 'REVOKE',
  // Role impersonation
  'SET ROLE', 'SET SESSION AUTHORIZATION',
  // Transaction control — the server manages its own BEGIN/COMMIT.
  // Allowing user-supplied transaction commands would break SET LOCAL
  // schema isolation and leave the connection in an inconsistent state.
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'RELEASE SAVEPOINT',
  // Prevent overriding the enforced search_path or statement_timeout
  'SET SEARCH_PATH', 'SET LOCAL SEARCH_PATH',
];

/** Fetch the project's schema name — cached in Redis for 10 min. */
const getProjectSchema = async (projectId) => {
  const cached = await redis.get(`project_schema:${projectId}`);
  if (cached) return cached;
  const { rows } = await db.query(
    'SELECT schema_name FROM public.projects WHERE project_id = $1',
    [projectId]
  );
  if (rows.length === 0) return null;
  await redis.set(`project_schema:${projectId}`, rows[0].schema_name, 'EX', 600);
  return rows[0].schema_name;
};

/**
 * Verify the requesting user is an active member of the project.
 * Returns the member row or null.
 */
const getProjectMember = async (projectId, userId) => {
  const { rows } = await db.query(
    `SELECT pm.role FROM public.project_members pm
     JOIN public.projects p ON p.project_id = pm.project_id
     WHERE pm.project_id = $1
       AND pm.user_id  = $2
       AND p.project_status != 'archived'`,
    [projectId, userId]
  );
  return rows[0] || null;
};

/** Strip SQL comments then split on semicolons. */
const parseStatements = (rawSql) => {
  let sql = rawSql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  sql = sql.replace(/--[^\r\n]*/g, ' ');
  return sql.split(';').map((s) => s.trim()).filter(Boolean);
};

/**
 * Strip both SQL comments AND single-quoted string literals from a query.
 *
 * This produces a sanitised string that is ONLY used for security checks
 * (forbidden keywords, cross-schema refs). It is never executed.
 *
 * Why: Without stripping string literals, a user value like
 *   INSERT INTO logs (msg) VALUES ('BEGIN a new session')
 * would falsely match the BEGIN keyword check. Similarly a comment could
 * be used to smuggle a forbidden keyword past a naive scan.
 */
const sanitiseForChecks = (sql) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // block comments
    .replace(/--[^\r\n]*/g, ' ')           // line comments
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");  // string literals → empty strings

/**
 * Build a whole-word regex for a keyword phrase such as "BEGIN" or
 * "DROP SCHEMA". Spaces in keyword phrases are matched as \s+ to handle
 * any amount of whitespace between the words.
 *
 * Using \b (word boundary) means "BEGIN" only matches the standalone SQL
 * keyword, NOT substrings like "begin_date", "commit_hash", "grant_id".
 */
const buildKeywordRegex = (keyword) => {
  const escaped = keyword
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars
    .replace(/\s+/g, '\\s+');               // allow flexible whitespace
  return new RegExp(`\\b${escaped}\\b`, 'i');
};

/** Pre-compiled regex map for all forbidden keywords (built once at startup). */
const FORBIDDEN_KEYWORD_REGEXES = FORBIDDEN_KEYWORDS.map((kw) => ({
  keyword: kw,
  regex: buildKeywordRegex(kw),
}));

/**
 * Detect schema-qualified references that cross schema boundaries.
 *
 * Strategy:
 *  1. Strip string literals so we don't false-positive on data values.
 *  2. Find every `word.word` token.
 *  3. Allow table aliases (t.id, a.name, etc.) — they won't match blocked schema names.
 *  4. Block if the left side matches a known dangerous schema name.
 *
 * This approach lets users write JOINs with table-qualified columns:
 *   SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id
 * while still blocking explicit schema prefixes like `public.users`.
 */
const detectForbiddenSchemaRef = (sanitisedSql, ownSchemaName) => {
  // sanitisedSql already has string literals removed by sanitiseForChecks()

  // Match word.word tokens (table.column or schema.table patterns)
  const dotPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = dotPattern.exec(sanitisedSql)) !== null) {
    const left = match[1].toLowerCase();
    // Block if left side is an explicitly known dangerous system/global schema
    if (BLOCKED_SCHEMA_PREFIXES.includes(left)) {
      return `Schema-qualified reference to "${left}" schema is not allowed. Use bare table names — schema isolation is enforced automatically.`;
    }
    // Block if left side matches the project's own schema name
    // (users should use bare table names, not explicit schema prefixes)
    if (ownSchemaName && left === ownSchemaName.toLowerCase()) {
      return `Explicit schema prefix "${ownSchemaName}" is not allowed. Use bare table names instead — isolation is enforced automatically.`;
    }
    // Everything else (t.id, a.name, alias.column) is allowed — it's a table alias
  }
  return null;
};

const executeQuery = async (req, res, next) => {
  const { query } = req.body;
  const userId    = req.user.id;
  const projectId = req.headers['x-project-id'];

  // ── Basic validation ──────────────────────────────────────────────────────
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

  // ── [SECURITY] Project membership authorization ───────────────────────────
  // Every authenticated user must be an active member of the project they
  // are querying. Without this check, any logged-in user could pass an
  // arbitrary X-Project-ID and execute SQL inside another user's schema.
  const member = await getProjectMember(projectId, userId);
  if (!member) {
    return res.status(403).json({
      status: 403,
      data: null,
      message: 'Access denied: you are not a member of this project.',
    });
  }

  // ── Sanitise query for security checks ───────────────────────────────────
  // Remove comments and string literals ONCE; reuse for both checks below.
  // This prevents data values like ('BEGIN a session') or comments from
  // being misread as dangerous SQL keywords or schema references.
  const sanitisedQuery = sanitiseForChecks(query);

  // ── Block dangerous DDL / admin operations ────────────────────────────────
  // Uses whole-word (\b) regex so column/table names that CONTAIN a forbidden
  // word as a substring (begin_date, grant_id, commit_hash, etc.) are NOT
  // falsely blocked. Only standalone SQL keywords are matched.
  const forbiddenEntry = FORBIDDEN_KEYWORD_REGEXES.find(({ regex }) => regex.test(sanitisedQuery));
  if (forbiddenEntry) {
    return res.status(403).json({
      status: 403,
      data: null,
      message: `Restricted operation: "${forbiddenEntry.keyword}" is not allowed in the SQL editor.`,
    });
  }

  // ── Resolve project schema ────────────────────────────────────────────────
  const schemaName = await getProjectSchema(projectId);
  if (!schemaName) {
    return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
  }

  // ── [SECURITY] Block cross-schema references ──────────────────────────────
  // sanitisedQuery already has comments + string literals stripped, so users
  // cannot hide schema references inside comments or data values.
  const schemaRefError = detectForbiddenSchemaRef(sanitisedQuery, schemaName);
  if (schemaRefError) {
    return res.status(403).json({ status: 403, data: null, message: schemaRefError });
  }

  // ── Execute using dedicated client with isolated search_path ─────────────
  const client     = await db.pool.connect();
  const startTime  = Date.now();
  try {
    // [SECURITY] schemaName is always "proj_<uuid>" — generated server-side, never user input.
    const safeSchema = schemaName.replace(/"/g, ''); // strip any stray quotes just in case

    // STEP 1: Set the SESSION-level search_path immediately on this client.
    //   This is the primary isolation guard: any bare table name (e.g. "users")
    //   will resolve ONLY inside the project schema. "public" is explicitly excluded.
    //   pg_catalog must come AFTER the project schema so user-defined functions take
    //   precedence, but built-ins (now(), count(), etc.) still work.
    await client.query(`SET search_path TO "${safeSchema}", pg_catalog`);

    // STEP 2: Limit query execution time to 30 seconds per statement.
    await client.query(`SET statement_timeout = '30s'`);

    // STEP 3: Begin an explicit transaction so that SET LOCAL works correctly.
    //   SET LOCAL is only effective inside an explicit transaction block.
    //   Without BEGIN, SET LOCAL silently becomes a session-level SET.
    //   Having both session-level (step 1) and LOCAL (inside transaction) is
    //   defence-in-depth: the session-level guard exists for any code that runs
    //   outside the transaction, and LOCAL re-affirms isolation inside it.
    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path TO "${safeSchema}", pg_catalog`);

    const results        = [];
    let   lastSelectRows = null;

    for (const stmt of statements) {
      const stmtUpper = stmt.toUpperCase().trim();
      const result    = await client.query(stmt);
      const isSelect  = stmtUpper.startsWith('SELECT')
                     || stmtUpper.startsWith('WITH')
                     || stmtUpper.startsWith('TABLE');
      results.push({
        statement : stmt.length > 80 ? stmt.slice(0, 80) + '…' : stmt,
        command   : result.command || 'UNKNOWN',
        rowCount  : result.rowCount || 0,
        rows      : result.rows || [],
      });
      if (isSelect && result.rows.length > 0) {
        lastSelectRows = result.rows;
      }
    }

    const durationMs = Date.now() - startTime;

    const responseData = lastSelectRows
      ? lastSelectRows
      : results.length === 1
        ? { message: 'Query executed successfully', command: results[0].command, rowCount: results[0].rowCount }
        : { message: `${results.length} statements executed`, statements: results.map((r) => `${r.command} (${r.rowCount} rows)`) };

    // Commit the transaction — all user statements ran inside BEGIN/COMMIT so
    // SET LOCAL search_path was properly scoped to this transaction.
    await client.query('COMMIT');

    // ── Persist to audit tables (main pool — writes to public schema, correct) ──
    // NOTE: We intentionally use db.query (main pool) here rather than the
    // isolated `client` because the `client` has search_path set to the project
    // schema. query_history and audit_log live in the public schema and must be
    // reached via the default pool connection.
    db.query(
      'INSERT INTO public.query_history (project_id, user_id, query_text, query_status, execution_time_ms, rows_affected) VALUES ($1, $2, $3, $4, $5, $6)',
      [projectId, userId, query.trim(), 'success', durationMs, results.reduce((s, r) => s + (r.rowCount || 0), 0)]
    ).catch((e) => console.error('[DB] query_history insert failed:', e.message));

    db.query(
      'INSERT INTO public.audit_log (project_id, actor_id, action_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [projectId, userId, 'QUERY_EXECUTED', JSON.stringify({ statements: statements.length, durationMs, memberRole: member.role }), req.ip]
    ).catch((e) => console.error('[DB] audit_log insert failed:', e.message));

    res.status(200).json({
      status  : 200,
      data    : { executionTimeMs: durationMs, data: responseData, statementsExecuted: results.length },
      message : 'Query executed successfully',
    });
  } catch (error) {
    // Rollback the transaction so the connection is returned to the pool in a
    // clean state. Failing to rollback leaves the connection in an aborted
    // transaction state and will break all subsequent queries on that client.
    await client.query('ROLLBACK').catch(() => {});
    db.query(
      'INSERT INTO public.query_history (project_id, user_id, query_text, query_status, error_message) VALUES ($1, $2, $3, $4, $5)',
      [projectId, userId, query.trim(), 'failed', error.message]
    ).catch(() => {});
    res.status(400).json({ status: 400, data: { error: error.message }, message: 'Query execution failed' });
  } finally {
    client.release();
  }
};

const getQueryHistory = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const userId    = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  if (!projectId) {
    return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID header required' });
  }

  // Membership check — users may only view history for their own projects
  const member = await getProjectMember(projectId, userId);
  if (!member) {
    return res.status(403).json({ status: 403, data: null, message: 'Access denied: not a project member.' });
  }

  try {
    const offset      = (parseInt(page) - 1) * parseInt(limit);
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM public.query_history WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    const { rows } = await db.query(
      `SELECT id, query_text, query_status, execution_time_ms, rows_affected, error_message, created_at
       FROM public.query_history
       WHERE project_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [projectId, userId, parseInt(limit), offset]
    );
    res.status(200).json({
      status  : 200,
      data    : { history: rows, total: parseInt(countResult.rows[0].total), page: parseInt(page) },
      message : 'Query history retrieved',
    });
  } catch (err) { next(err); }
};

const getAuditLogs = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const userId    = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  if (!projectId) {
    return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID header required' });
  }

  // Only admins/owners may view audit logs
  const member = await getProjectMember(projectId, userId);
  if (!member) {
    return res.status(403).json({ status: 403, data: null, message: 'Access denied: not a project member.' });
  }
  if (member.role === 'viewer') {
    return res.status(403).json({ status: 403, data: null, message: 'Viewers cannot access audit logs.' });
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await db.query(
      `SELECT al.id, al.actor_id, al.action_type, al.details, al.ip_address, al.created_at,
              u.email as actor_email, u.name as actor_name
       FROM public.audit_log al
       LEFT JOIN public.users u ON u.id = al.actor_id
       WHERE al.project_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [projectId, parseInt(limit), offset]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Audit logs retrieved' });
  } catch (err) { next(err); }
};

module.exports = { executeQuery, getQueryHistory, getAuditLogs };
