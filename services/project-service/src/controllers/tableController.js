const db = require('../config/db');
const { logAction, ACTION_TYPES } = require('../utils/auditLogger');

const validateColumn = (col) => {
  if (!col.name || typeof col.name !== 'string' || !/^[a-z_][a-z0-9_]*$/.test(col.name)) return `Invalid column name: ${col.name}`;
  if (!col.dataType || typeof col.dataType !== 'string') return `Missing data type for column: ${col.name}`;
  if (col.dataType.toUpperCase() === 'ENUM' && (!Array.isArray(col.enumValues) || col.enumValues.length === 0)) return `ENUM column "${col.name}" requires enumValues`;
  if (col.dataType.toUpperCase() === 'ARRAY' && !col.baseType) return `ARRAY column "${col.name}" requires baseType`;
  return null;
};

const buildColumnSql = (col, schemaName) => {
  let sql = `"${col.name}" `;
  if (col.dataType.toUpperCase() === 'ENUM') { sql += `${schemaName}_${col.name}_enum`; }
  else if (col.dataType.toUpperCase() === 'ARRAY') { sql += `${col.baseType}[]`; }
  else { sql += col.dataType; }
  if (col.isPrimaryKey) sql += ' PRIMARY KEY';
  if (col.isUnique) sql += ' UNIQUE';
  if (col.isNullable === false) sql += ' NOT NULL';
  if (col.defaultValue !== undefined && col.defaultValue !== null) sql += ` DEFAULT ${col.defaultValue}`;
  if (col.check) sql += ` CHECK (${col.check})`;
  return sql;
};

const buildForeignKeySql = (col, schemaName) => {
  if (!col.referencesTable || !col.referencesColumn) return '';
  let sql = `FOREIGN KEY ("${col.name}") REFERENCES "${schemaName}"."${col.referencesTable}" ("${col.referencesColumn}")`;
  if (col.onDelete) sql += ` ON DELETE ${col.onDelete.toUpperCase()}`;
  if (col.onUpdate) sql += ` ON UPDATE ${col.onUpdate.toUpperCase()}`;
  return sql;
};

const getProjectAccess = async (projectId, userId) => {
  const { rows } = await db.query(
    `SELECT p.schema_name, p.owner_id, pm.role FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $2
     WHERE p.project_id = $1`,
    [projectId, userId]
  );
  return rows[0] || null;
};

const createEnumTypes = async (client, columns, schemaName) => {
  for (const col of columns) {
    if (col.dataType.toUpperCase() === 'ENUM') {
      const typeName = `${schemaName}_${col.name}_enum`;
      const enumValues = col.enumValues.map(v => `'${v}'`).join(', ');
      await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN CREATE TYPE "${typeName}" AS ENUM (${enumValues}); END IF; END$$;`);
    }
  }
};

// CREATE TABLE
const createTable = async (req, res, next) => {
  const { projectId } = req.params;
  const { tableName, columns } = req.body;
  const userId = req.user.id;
  if (!tableName || !columns || !Array.isArray(columns)) {
    return res.status(400).json({ status: 400, data: null, message: 'Table name and columns are required.' });
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const project = await getProjectAccess(projectId, userId);
    if (!project) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Project not found.' }); }
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor'].includes(role)) { await client.query('ROLLBACK'); return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' }); }
    for (const col of columns) { const err = validateColumn(col); if (err) { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: err }); } }
    await createEnumTypes(client, columns, schema_name);
    const columnSql = columns.map(col => buildColumnSql(col, schema_name)).join(', ');
    const fkSql = columns.map(col => buildForeignKeySql(col, schema_name)).filter(Boolean).join(', ');
    let sql = `CREATE TABLE "${schema_name}"."${tableName}" (${columnSql}`;
    if (fkSql) sql += `, ${fkSql}`;
    sql += ');';
    await client.query(sql);
    // Grant web_anon (PostgREST role) CRUD access so API key holders can query this table
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "${schema_name}"."${tableName}" TO web_anon;`);
    // Grant sequence access for auto-increment columns
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schema_name}" TO web_anon;`);
    // Reload PostgREST schema cache so the new table is immediately available
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.TABLE_CREATED, details: { tableName, schema_name }, ipAddress: req.ip });
    await client.query('COMMIT');
    res.status(201).json({ status: 201, data: { tableName }, message: 'Table created successfully.' });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

// GET PROJECT TABLES
const getProjectTables = async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    }
    const { rows } = await db.query(
      `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schema_name]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Tables retrieved.' });
  } catch (err) { next(err); }
};

// GET TABLE DETAILS
const getTableDetails = async (req, res, next) => {
  // BUG FIX: use tableName (was incorrectly tableId after BUG-2 route param rename)
  const { projectId, tableName } = req.params;
  const userId = req.user.id;
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    }
    const { rows } = await db.query(
      `SELECT
         c.column_name,
         c.data_type,
         c.is_nullable,
         c.column_default,
         c.udt_name,
         CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
       FROM information_schema.columns c
       LEFT JOIN (
         SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
           AND tc.table_name = kcu.table_name
         WHERE tc.constraint_type = 'PRIMARY KEY'
           AND tc.table_schema = $1
           AND tc.table_name = $2
       ) pk ON c.column_name = pk.column_name
       WHERE c.table_schema = $1 AND c.table_name = $2
       ORDER BY c.ordinal_position`,
      [schema_name, tableName]
    );
    if (!rows.length) return res.status(404).json({ status: 404, data: null, message: 'Table not found.' });
    const { rows: fkRows } = await db.query(
      `SELECT kcu.column_name, ccu.table_name AS references_table, ccu.column_name AS references_column,
              rc.update_rule AS on_update, rc.delete_rule AS on_delete
       FROM information_schema.key_column_usage kcu
       JOIN information_schema.constraint_column_usage ccu ON kcu.constraint_name = ccu.constraint_name
       JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
       WHERE kcu.table_schema = $1 AND kcu.table_name = $2`,
      [schema_name, tableName]
    );
    res.status(200).json({ status: 200, data: { columns: rows, foreignKeys: fkRows }, message: 'Table details retrieved.' });
  } catch (err) { next(err); }
};

// GET TABLE DATA (rows) with sort, search, filter
const getTableData = async (req, res, next) => {
  const { projectId, tableName } = req.params;
  const { page = 1, limit = 50, sortBy, sortOrder = 'asc', search } = req.query;
  const userId = req.user.id;
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: colRows } = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      [schema_name, tableName]
    );
    const validColumns = colRows.map(r => r.column_name);
    let whereClause = '';
    const queryParams = [];
    if (search && search.trim() && validColumns.length > 0) {
      const searchClauses = validColumns.map(col => `CAST("${col}" AS TEXT) ILIKE $1`);
      whereClause = `WHERE ${searchClauses.join(' OR ')}`;
      queryParams.push(`%${search.trim()}%`);
    }
    let orderClause = '';
    if (sortBy && validColumns.includes(sortBy)) {
      const direction = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY "${sortBy}" ${direction}`;
    }
    const baseTable = `"${schema_name}"."${tableName}"`;
    const countResult = await db.query(`SELECT COUNT(*) as total FROM ${baseTable} ${whereClause}`, queryParams);
    const { rows } = await db.query(
      `SELECT * FROM ${baseTable} ${whereClause} ${orderClause} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, parseInt(limit), offset]
    );
    res.status(200).json({
      status: 200,
      data: { rows, total: parseInt(countResult.rows[0].total), page: parseInt(page), limit: parseInt(limit) },
      message: 'Table data retrieved.'
    });
  } catch (err) { next(err); }
};

// INSERT ROW
const insertRow = async (req, res, next) => {
  // BUG FIX: use tableName (was incorrectly tableId after BUG-2 route param rename)
  const { projectId, tableName } = req.params;
  const { row } = req.body;
  const userId = req.user.id;
  if (!row || typeof row !== 'object') return res.status(400).json({ status: 400, data: null, message: 'Row data required.' });
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor'].includes(role)) return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    // Filter out columns where value is null/empty and column has a DB default
    // (handles UUID PKs, serials, and any DEFAULT gen_random_uuid() columns)
    const filteredRow = {};
    for (const [key, val] of Object.entries(row)) {
      if (val === null || val === '' || val === undefined) {
        // Check if this column has a default — if so, omit it and let DB handle it
        const { rows: colMeta } = await db.query(
          `SELECT column_default FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2 AND column_name = $3`,
          [schema_name, tableName, key]
        );
        if (colMeta[0]?.column_default) continue; // skip — DB will use its default
      }
      filteredRow[key] = val;
    }
    const cols = Object.keys(filteredRow);
    const vals = Object.values(filteredRow);
    if (cols.length === 0) {
      // All columns have defaults — insert empty row
      const { rows } = await db.query(
        `INSERT INTO "${schema_name}"."${tableName}" DEFAULT VALUES RETURNING *`
      );
      await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.ROW_CREATED, details: { tableName, row: rows[0] }, ipAddress: req.ip });
      return res.status(201).json({ status: 201, data: rows[0], message: 'Row inserted.' });
    }
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await db.query(
      `INSERT INTO "${schema_name}"."${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.ROW_CREATED, details: { tableName, row: rows[0] }, ipAddress: req.ip });
    res.status(201).json({ status: 201, data: rows[0], message: 'Row inserted.' });
  } catch (err) { next(err); }
};

// UPDATE ROW
const updateRow = async (req, res, next) => {
  // BUG FIX: use tableName (was incorrectly tableId after BUG-2 route param rename)
  const { projectId, tableName } = req.params;
  const { primaryKey, primaryValue, updates } = req.body;
  const userId = req.user.id;
  if (!primaryKey || !updates) return res.status(400).json({ status: 400, data: null, message: 'Primary key and updates required.' });
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor'].includes(role)) return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    const setClauses = Object.keys(updates).map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), primaryValue];
    const { rows } = await db.query(
      `UPDATE "${schema_name}"."${tableName}" SET ${setClauses} WHERE "${primaryKey}" = $${values.length} RETURNING *`,
      values
    );
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.ROW_UPDATED, details: { tableName, primaryKey, primaryValue }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: rows[0], message: 'Row updated.' });
  } catch (err) { next(err); }
};

// DELETE ROW
const deleteRow = async (req, res, next) => {
  // BUG FIX: use tableName (was incorrectly tableId after BUG-2 route param rename)
  const { projectId, tableName } = req.params;
  const { primaryKey, primaryValue } = req.body;
  const userId = req.user.id;
  if (!primaryKey) return res.status(400).json({ status: 400, data: null, message: 'Primary key required.' });
  try {
    const project = await getProjectAccess(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found.' });
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor'].includes(role)) return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    await db.query(`DELETE FROM "${schema_name}"."${tableName}" WHERE "${primaryKey}" = $1`, [primaryValue]);
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.ROW_DELETED, details: { tableName, primaryKey, primaryValue }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: null, message: 'Row deleted.' });
  } catch (err) { next(err); }
};

// DELETE TABLE — BUG-2 FIX: read tableName from params, not body
const deleteTable = async (req, res, next) => {
  const { projectId, tableName } = req.params;
  const userId = req.user.id;
  if (!tableName) return res.status(400).json({ status: 400, data: null, message: 'Table name required.' });
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const project = await getProjectAccess(projectId, userId);
    if (!project) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Project not found.' }); }
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && role !== 'admin') { await client.query('ROLLBACK'); return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' }); }
    await client.query(`DROP TABLE IF EXISTS "${schema_name}"."${tableName}" CASCADE;`);
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.TABLE_DELETED, details: { tableName, schema_name }, ipAddress: req.ip });
    await client.query('COMMIT');
    res.status(200).json({ status: 200, data: null, message: 'Table deleted.' });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

// ALTER TABLE — BUG-3 FIX: new endpoint for schema modifications
// Supports: ADD COLUMN, DROP COLUMN, RENAME COLUMN, SET DEFAULT, DROP DEFAULT
const alterTable = async (req, res, next) => {
  const { projectId, tableName } = req.params;
  const { alterations } = req.body; // array of { operation, columnName, newColumnName, dataType, defaultValue }
  const userId = req.user.id;

  if (!tableName) return res.status(400).json({ status: 400, data: null, message: 'Table name required.' });
  if (!Array.isArray(alterations) || alterations.length === 0) {
    return res.status(400).json({ status: 400, data: null, message: 'alterations array is required.' });
  }

  const VALID_OPS = ['ADD_COLUMN', 'DROP_COLUMN', 'RENAME_COLUMN', 'SET_DEFAULT', 'DROP_DEFAULT', 'SET_NOT_NULL', 'DROP_NOT_NULL'];

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const project = await getProjectAccess(projectId, userId);
    if (!project) { await client.query('ROLLBACK'); return res.status(404).json({ status: 404, data: null, message: 'Project not found.' }); }
    const { schema_name, owner_id, role } = project;
    if (userId !== owner_id && !['admin', 'editor'].includes(role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 403, data: null, message: 'Permission denied.' });
    }

    for (const alt of alterations) {
      const { operation, columnName, newColumnName, dataType, defaultValue } = alt;
      if (!operation || !VALID_OPS.includes(operation.toUpperCase())) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 400, data: null, message: `Invalid operation: ${operation}. Valid: ${VALID_OPS.join(', ')}` });
      }
      if (!columnName && operation !== 'ADD_COLUMN') {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 400, data: null, message: 'columnName is required for this operation.' });
      }

      const baseAlter = `ALTER TABLE "${schema_name}"."${tableName}"`;

      switch (operation.toUpperCase()) {
        case 'ADD_COLUMN': {
          if (!columnName || !dataType) {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 400, data: null, message: 'columnName and dataType required for ADD_COLUMN.' });
          }
          const err = validateColumn({ name: columnName, dataType });
          if (err) { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: err }); }
          let colDef = `"${columnName}" ${dataType}`;
          if (defaultValue !== undefined && defaultValue !== null) colDef += ` DEFAULT ${defaultValue}`;
          await client.query(`${baseAlter} ADD COLUMN ${colDef};`);
          break;
        }
        case 'DROP_COLUMN':
          await client.query(`${baseAlter} DROP COLUMN IF EXISTS "${columnName}" CASCADE;`);
          break;
        case 'RENAME_COLUMN':
          if (!newColumnName) { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: 'newColumnName required for RENAME_COLUMN.' }); }
          await client.query(`${baseAlter} RENAME COLUMN "${columnName}" TO "${newColumnName}";`);
          break;
        case 'SET_DEFAULT':
          if (defaultValue === undefined) { await client.query('ROLLBACK'); return res.status(400).json({ status: 400, data: null, message: 'defaultValue required for SET_DEFAULT.' }); }
          await client.query(`${baseAlter} ALTER COLUMN "${columnName}" SET DEFAULT ${defaultValue};`);
          break;
        case 'DROP_DEFAULT':
          await client.query(`${baseAlter} ALTER COLUMN "${columnName}" DROP DEFAULT;`);
          break;
        case 'SET_NOT_NULL':
          await client.query(`${baseAlter} ALTER COLUMN "${columnName}" SET NOT NULL;`);
          break;
        case 'DROP_NOT_NULL':
          await client.query(`${baseAlter} ALTER COLUMN "${columnName}" DROP NOT NULL;`);
          break;
        default:
          break;
      }
    }

    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.TABLE_UPDATED, details: { tableName, schema_name, alterations }, ipAddress: req.ip });
    await client.query('COMMIT');
    res.status(200).json({ status: 200, data: { tableName, alterations }, message: 'Table altered successfully.' });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

module.exports = { createTable, getProjectTables, getTableDetails, getTableData, insertRow, updateRow, deleteRow, deleteTable, alterTable };

