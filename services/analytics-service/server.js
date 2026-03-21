require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/analytics', analyticsRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'analytics-service' }));

app.use((err, req, res, next) => {
  console.error('[Analytics Service] Error:', err);
  res.status(500).json({ status: 500, data: null, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`[Analytics Service] Running on port ${PORT}`));
