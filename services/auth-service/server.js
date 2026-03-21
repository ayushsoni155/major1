require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Auth Service] Error:', err);
  res.status(500).json({
    status: 500,
    data: null,
    message: 'Internal server error',
  });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});
