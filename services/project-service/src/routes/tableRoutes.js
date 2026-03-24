const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTable, getProjectTables, getTableDetails, getTableData, insertRow, updateRow, deleteRow, deleteTable, alterTable } = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

router.use(protect);

router.route('/:projectId/tables')
  .post(checkProjectRole(['admin', 'editor']),
    [body('tableName').not().isEmpty(), body('columns').isArray({ min: 1 })],
    createTable)
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getProjectTables);

// BUG-2 FIX: use :tableName param for DELETE (not :tableId + body)
// BUG-3 FIX: PATCH for ALTER TABLE operations
router.route('/:projectId/tables/:tableName')
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getTableDetails)
  .patch(checkProjectRole(['admin', 'editor']), alterTable)
  .delete(checkProjectRole(['admin']), deleteTable);

// BUG FIX: was :tableId — changed to :tableName to match all other routes and controller params
router.route('/:projectId/tables/:tableName/data')
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getTableData)
  .post(checkProjectRole(['admin', 'editor']), insertRow);

router.route('/:projectId/tables/:tableName/rows')
  .patch(checkProjectRole(['admin', 'editor']), updateRow)
  .delete(checkProjectRole(['admin', 'editor']), deleteRow);

module.exports = router;
