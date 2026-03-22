require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');

const app = express();

// ---- CORS: allow frontend origin with credentials ----
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost',
  'http://localhost:3000',
  'http://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// ---- Body parsers ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Cookie parser (signed cookies) ----
app.use(cookieParser(process.env.COOKIE_SECRET));

// ---- Routes ----
app.use('/auth', authRoutes);

// ---- Health check ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error('[Auth Service] Unhandled error:', err);
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
