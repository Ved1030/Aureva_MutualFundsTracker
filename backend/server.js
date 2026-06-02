const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fundRoutes = require('./routes/fundRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');

dotenv.config();

const app = express();

console.log('[SERVER] Initializing Aureva Backend...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('[SERVER] PORT:', process.env.PORT || '5000 (default)');

app.set('query parser', 'extended');

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) {
      console.log(`[CORS] Allowed Vercel origin: ${origin}`);
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Aureva Backend Running',
  });
});

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    status: dbState === 1 ? 'ok' : 'error',
    database: dbStatus[dbState] || 'unknown',
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'ok',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

console.log('[SERVER] Registering routes...');
console.log('[SERVER]   POST /api/auth/register');
console.log('[SERVER]   POST /api/auth/login');
console.log('[SERVER]   GET  /api/funds/search');
console.log('[SERVER]   GET  /api/funds/:schemeCode');
console.log('[SERVER]   GET  /api/watchlist');
console.log('[SERVER]   POST /api/watchlist');
console.log('[SERVER]   DELETE /api/watchlist/:schemeCode');

app.use('/api/auth', authRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.use((req, res) => {
  console.warn(`[SERVER] 404 — ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  console.log('[SERVER] MongoDB connected, starting HTTP server...');
  app.listen(PORT, () => {
    console.log('══════════════════════════════════════════');
    console.log('  [SERVER] SERVER STARTED');
    console.log(`  [SERVER] PORT: ${PORT}`);
    console.log(`  [SERVER] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  [SERVER] MongoDB: Connected`);
    console.log(`  [SERVER] CORS: ${allowedOrigins.length} local origins + *.vercel.app`);
    console.log('══════════════════════════════════════════');
  });
}).catch((err) => {
  console.error('══════════════════════════════════════════');
  console.error('  [SERVER] FAILED TO START');
  console.error(`  [SERVER] MongoDB connection error: ${err.message}`);
  console.error('  [SERVER] Check MONGO_URI environment variable.');
  console.error('══════════════════════════════════════════');
  process.exit(1);
});
