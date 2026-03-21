require('dotenv').config();
const express = require('express');
const cors = require('cors');

const projectRoutes = require('./src/routes/projectRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const schemaRoutes = require('./src/routes/schemaRoutes');
const apiKeyRoutes = require('./src/routes/apiKeyRoutes');
const memberRoutes = require('./src/routes/memberRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
