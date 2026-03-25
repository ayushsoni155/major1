const db = require('../config/db');
const redis = require('../config/redis');

// GET available tables for a project
const getTables = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID required' });

  try {
    const { rows: projectRows } = await db.query('SELECT schema_name FROM projects WHERE project_id = $1', [projectId]);
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    const schema = projectRows[0].schema_name;

    const { rows } = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schema]
    );
    res.status(200).json({ status: 200, data: rows.map(r => r.table_name), message: 'Tables retrieved' });
  } catch (err) { next(err); }
};

// GET columns for a specific table
const getTableColumns = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const { tableName } = req.params;
  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID required' });

  try {
    const { rows: projectRows } = await db.query('SELECT schema_name FROM projects WHERE project_id = $1', [projectId]);
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    const schema = projectRows[0].schema_name;

    const { rows } = await db.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [schema, tableName]
    );
    res.status(200).json({ status: 200, data: rows, message: 'Columns retrieved' });
  } catch (err) { next(err); }
};

// GET aggregated analytics data
const getChartData = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const { tableName, xField, yField, aggregation = 'COUNT', limit = 50 } = req.query;

  if (!projectId || !tableName || !xField) {
    return res.status(400).json({ status: 400, data: null, message: 'projectId, tableName, and xField required' });
  }

  const validAggregations = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  if (!validAggregations.includes(aggregation.toUpperCase())) {
    return res.status(400).json({ status: 400, data: null, message: `Invalid aggregation. Use: ${validAggregations.join(', ')}` });
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 500);

  try {
    const cacheKey = `analytics:${projectId}:${tableName}:${xField}:${yField || ''}:${aggregation}:${safeLimit}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.status(200).json({ status: 200, data: JSON.parse(cached), message: 'Chart data (cached)' });

    const { rows: projectRows } = await db.query('SELECT schema_name FROM projects WHERE project_id = $1', [projectId]);
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    const schema = projectRows[0].schema_name;

    let sql;
    if (yField && yField !== 'none') {
      sql = `SELECT "${xField}" as label, ${aggregation.toUpperCase()}("${yField}") as value
             FROM "${schema}"."${tableName}"
             GROUP BY "${xField}" ORDER BY value DESC LIMIT ${safeLimit}`;
    } else {
      sql = `SELECT "${xField}" as label, COUNT(*) as value
             FROM "${schema}"."${tableName}"
             GROUP BY "${xField}" ORDER BY value DESC LIMIT ${safeLimit}`;
    }

    const { rows } = await db.query(sql);
    await redis.set(cacheKey, JSON.stringify(rows), 'EX', 300);
    res.status(200).json({ status: 200, data: rows, message: 'Chart data retrieved' });
  } catch (err) { next(err); }
};

// GET table stats overview
const getTableStats = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID required' });

  try {
    const { rows: projectRows } = await db.query('SELECT schema_name FROM projects WHERE project_id = $1', [projectId]);
    if (!projectRows.length) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    const schema = projectRows[0].schema_name;

    const { rows: tables } = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
      [schema]
    );

    const stats = [];
    for (const t of tables) {
      const countResult = await db.query(`SELECT COUNT(*) as row_count FROM "${schema}"."${t.table_name}"`);
      const colResult = await db.query(
        `SELECT COUNT(*) as col_count FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
        [schema, t.table_name]
      );
      stats.push({
        table_name: t.table_name,
        row_count: parseInt(countResult.rows[0].row_count),
        column_count: parseInt(colResult.rows[0].col_count),
      });
    }

    res.status(200).json({ status: 200, data: stats, message: 'Table stats retrieved' });
  } catch (err) { next(err); }
};

// SAVE dashboard layout + widgets for a project (upsert)
const saveDashboard = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  const { layout, widgets } = req.body;

  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID required' });
  if (!Array.isArray(layout) || !Array.isArray(widgets)) {
    return res.status(400).json({ status: 400, data: null, message: 'layout and widgets must be arrays' });
  }

  try {
    await db.query(
      `INSERT INTO analytics_dashboards (project_id, layout, widgets, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (project_id)
       DO UPDATE SET layout = EXCLUDED.layout, widgets = EXCLUDED.widgets, updated_at = NOW()`,
      [projectId, JSON.stringify(layout), JSON.stringify(widgets)]
    );
    res.status(200).json({ status: 200, data: null, message: 'Dashboard saved' });
  } catch (err) { next(err); }
};

// GET saved dashboard for a project
const getDashboard = async (req, res, next) => {
  const projectId = req.headers['x-project-id'];
  if (!projectId) return res.status(400).json({ status: 400, data: null, message: 'X-Project-ID required' });

  try {
    const { rows } = await db.query(
      'SELECT layout, widgets, updated_at FROM analytics_dashboards WHERE project_id = $1',
      [projectId]
    );
    if (!rows.length) {
      return res.status(200).json({ status: 200, data: { layout: [], widgets: [] }, message: 'No saved dashboard' });
    }
    res.status(200).json({ status: 200, data: rows[0], message: 'Dashboard loaded' });
  } catch (err) { next(err); }
};

module.exports = { getTables, getTableColumns, getChartData, getTableStats, saveDashboard, getDashboard };
