const db = require('../config/db');
const { validationResult } = require('express-validator');
const { generateSchemaName } = require('../utils/sanitize');
const { logAction, ACTION_TYPES } = require('../utils/auditLogger');

const getProjectWithRole = async (projectId, userId) => {
  const { rows } = await db.query(
    `SELECT p.*, pm.role FROM projects p
     LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $2
     WHERE p.project_id = $1`,
    [projectId, userId]
  );
  return rows[0] || null;
};

// CREATE PROJECT
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
    // BUG-8 FIX: Grant web_anon (PostgREST role) access to the new project schema
    // so API key holders can query it via PostgREST. Also notify PostgREST to
    // reload its schema cache so the new schema is immediately available.
    await client.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO web_anon;`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT USAGE, SELECT ON SEQUENCES TO web_anon;`);
    await client.query(`NOTIFY pgrst, 'reload config';`);
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    await client.query('COMMIT');
    await logAction({ projectId: project.project_id, actorId: ownerId, actionType: ACTION_TYPES.PROJECT_CREATED, details: { project_name: name, schemaName }, ipAddress: req.ip });
    res.status(201).json({ status: 201, data: project, message: 'Project created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// GET USER PROJECTS
const getUserProjects = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, pm.role, u.name AS owner_name
       FROM projects p
       LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $1
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1 OR pm.user_id IS NOT NULL
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Projects retrieved successfully' });
  } catch (error) { next(error); }
};

// GET PROJECT DETAILS
const getProjectDetails = async (req, res, next) => {
  try {
    const project = await getProjectWithRole(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    res.status(200).json({ status: 200, data: project, message: 'Project details retrieved' });
  } catch (error) { next(error); }
};

// UPDATE PROJECT
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
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.PROJECT_UPDATED, details: { name, status, description }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: rows[0], message: 'Project updated' });
  } catch (error) { next(error); }
};

// DELETE PROJECT
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
    await logAction({ projectId, actorId: userId, actionType: ACTION_TYPES.PROJECT_DELETED, details: { project_name: project.project_name }, ipAddress: req.ip });
    res.status(200).json({ status: 200, data: null, message: 'Project deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// VALIDATE API KEY (used by Nginx auth_request)
const validateApiKey = async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const origin = req.headers['x-origin'] || '';
  
  if (!apiKey) return res.status(401).json({ message: 'Missing API key' });

  try {
    const { rows } = await db.query(
      `SELECT a.origin_url, a.is_active, p.schema_name
       FROM api_keys a
       JOIN projects p ON a.project_id = p.project_id
       WHERE a.api_key = $1`,
      [apiKey]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: 'Invalid or inactive API key' });
    }

    const keyData = rows[0];
    if (keyData.origin_url && keyData.origin_url !== '*' && origin !== keyData.origin_url) {
      return res.status(403).json({ message: 'Origin not allowed' });
    }

    db.query(`UPDATE api_keys SET last_used_at = NOW() WHERE api_key = $1`, [apiKey]).catch(e => console.error(e));

    res.set('X-Schema-Name', keyData.schema_name);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('API Key Validation Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createProject, getUserProjects, getProjectDetails, updateProject, deleteProject, validateApiKey };
