const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createProject, getUserProjects, getProjectDetails, updateProject, deleteProject, validateApiKey } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const checkProjectRole = require('../middleware/permissionMiddleware');

// Public route for Nginx auth_request
router.get('/validate-api-key', validateApiKey);

router.use(protect);

router.route('/')
  .post([body('name', 'Project name is required').not().isEmpty()], createProject)
  .get(getUserProjects);

router.route('/:projectId')
  .get(getProjectDetails)
  .patch(checkProjectRole(['admin']), updateProject)
  .delete(checkProjectRole(['admin']), deleteProject);

module.exports = router;
