const db = require('../config/db');

const logAction = async ({ projectId, actorId, actionType, details = {}, ipAddress = null }) => {
  try {
    if (!projectId || !actorId || !actionType) return;
    await db.query(
      `INSERT INTO audit_log (project_id, actor_id, action_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
      [projectId, actorId, actionType, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Failed to write audit_log:', error.message);
  }
};

const ACTION_TYPES = Object.freeze({
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_DELETED: 'API_KEY_DELETED',
  TABLE_CREATED: 'TABLE_CREATED',
  TABLE_UPDATED: 'TABLE_UPDATED',
  TABLE_DELETED: 'TABLE_DELETED',
  ROW_CREATED: 'ROW_CREATED',
  ROW_UPDATED: 'ROW_UPDATED',
  ROW_DELETED: 'ROW_DELETED',
  QUERY_EXECUTED: 'QUERY_EXECUTED',
});

module.exports = { logAction, ACTION_TYPES };
