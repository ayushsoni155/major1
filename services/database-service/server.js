require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const queryRoutes = require('./src/routes/queryRoutes');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/query', queryRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'database-service' }));

app.use((err, req, res, next) => {
  console.error('[Database Service] Error:', err);
  res.status(500).json({ status: 500, data: null, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`[Database Service] Running on port ${PORT}`));
