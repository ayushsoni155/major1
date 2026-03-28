require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const projectRoutes = require('./src/routes/projectRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const schemaRoutes = require('./src/routes/schemaRoutes');
const apiKeyRoutes = require('./src/routes/apiKeyRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const invitationRoutes = require('./src/routes/invitationRoutes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// IMPORTANT: validate-api-key must be registered BEFORE any router that uses
// protect middleware, because those routers reject unauthenticated requests.
const { validateApiKey } = require('./src/controllers/projectController');
app.get('/projects/validate-api-key', validateApiKey);

// IMPORTANT: Static-prefix routes (notifications, invitations) MUST be registered
// BEFORE projectRoutes which has a /:projectId wildcard. If projectRoutes is first,
// GET /projects/notifications is treated as /:projectId="notifications" → UUID parse error.
app.use('/projects', notificationRoutes);
app.use('/projects', invitationRoutes);
app.use('/projects', projectRoutes);
app.use('/projects', tableRoutes);
app.use('/projects', apiKeyRoutes);
app.use('/projects', memberRoutes);
app.use('/schema', schemaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'project-service' });
});

app.use((err, req, res, next) => {
  console.error('[Project Service] Error:', err);
  res.status(500).json({ status: 500, data: null, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`[Project Service] Running on port ${PORT}`);
});


