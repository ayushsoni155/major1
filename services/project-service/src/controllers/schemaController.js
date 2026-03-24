const db = require('../config/db');

const getProjectWithRole = async (projectId, userId) => {
  const { rows } = await db.query(
    `SELECT p.*, pm.role FROM projects p
     LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $2
     WHERE p.project_id = $1`,
    [projectId, userId]
  );
  return rows[0] || null;
};

// GET SCHEMA STRUCTURE (for ReactFlow visualization)
const getSchemaStructure = async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  let client;
  try {
    const project = await getProjectWithRole(projectId, userId);
    if (!project) return res.status(404).json({ status: 404, data: null, message: 'Project not found' });
    const schemaName = project.schema_name;
    client = await db.pool.connect();
    // BUG-6 FIX: Use DISTINCT ON to prevent duplicate column rows
    // when a column has multiple constraints (e.g. PK + FK)
    const { rows } = await client.query(
      `SELECT DISTINCT ON (t.table_name, c.column_name)
              t.table_name, c.column_name, c.data_type,
              tc.constraint_type,
              kcu2.table_name AS foreign_table, kcu2.column_name AS foreign_column
       FROM information_schema.tables t
       JOIN information_schema.columns c
         ON t.table_name = c.table_name AND t.table_schema = c.table_schema
       LEFT JOIN information_schema.key_column_usage kcu
         ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name AND c.table_schema = kcu.table_schema
       LEFT JOIN information_schema.table_constraints tc
         ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
       LEFT JOIN information_schema.referential_constraints rc
         ON kcu.constraint_name = rc.constraint_name
       LEFT JOIN information_schema.key_column_usage kcu2
         ON rc.unique_constraint_name = kcu2.constraint_name
       WHERE t.table_schema = $1
       ORDER BY t.table_name, c.column_name, tc.constraint_type`,
      [schemaName]
    );
    const tables = {};
    const edges = [];
    rows.forEach((row) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = {
          id: row.table_name,
          type: 'databaseSchema',
          position: { x: Math.random() * 400, y: Math.random() * 300 },
          data: { label: row.table_name, schema: [] },
        };
      }
      let keyType = null;
      if (row.constraint_type === 'PRIMARY KEY') keyType = 'PK';
      if (row.constraint_type === 'FOREIGN KEY') keyType = 'FK';
      tables[row.table_name].data.schema.push({
        title: row.column_name,
        type: row.data_type,
        key: keyType,
      });
      if (row.foreign_table && row.foreign_column) {
        edges.push({
          id: `${row.table_name}-${row.foreign_table}-${row.column_name}`,
          source: row.table_name,
          target: row.foreign_table,
          sourceHandle: row.column_name,
          targetHandle: row.foreign_column,
          animated: true,
          type: 'smoothstep',
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: 'var(--primary)' },
        });
      }
    });
    res.status(200).json({ status: 200, data: { nodes: Object.values(tables), edges, schemaName }, message: 'Schema visualized' });
  } catch (err) { next(err); }
  finally { if (client) client.release(); }
};

module.exports = { getSchemaStructure };
