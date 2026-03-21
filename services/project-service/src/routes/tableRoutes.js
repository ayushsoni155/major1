const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTable, getProjectTables, getTableDetails, getTableData, insertRow, updateRow, deleteRow, deleteTable } = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

router.use(protect);

router.route('/:projectId/tables')
  .post(checkProjectRole(['admin', 'editor']),
    [body('tableName').not().isEmpty(), body('columns').isArray({ min: 1 })],
    createTable)
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getProjectTables);

router.route('/:projectId/tables/:tableId')
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getTableDetails)
  .delete(checkProjectRole(['admin']), deleteTable);

router.route('/:projectId/tables/:tableId/data')
  .get(checkProjectRole(['admin', 'editor', 'viewer']), getTableData)
  .post(checkProjectRole(['admin', 'editor']), insertRow);

router.route('/:projectId/tables/:tableId/rows')
  .patch(checkProjectRole(['admin', 'editor']), updateRow)
  .delete(checkProjectRole(['admin', 'editor']), deleteRow);

module.exports = router;
