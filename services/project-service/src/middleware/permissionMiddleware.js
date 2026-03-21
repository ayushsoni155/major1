const db = require('../config/db');

const checkProjectRole = (roles = []) => {
  return async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: 401, data: null, message: 'Unauthorized' });
    }

    try {
      const { rows } = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2 LIMIT 1',
        [projectId, userId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ status: 403, data: null, message: 'Access denied. Not a member of this project.' });
      }

      const userRole = rows[0].role;
      if (roles.length > 0 && !roles.includes(userRole)) {
        return res.status(403).json({ status: 403, data: null, message: `Access denied. Requires: ${roles.join(', ')}` });
      }

      req.projectRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkProjectRole;
