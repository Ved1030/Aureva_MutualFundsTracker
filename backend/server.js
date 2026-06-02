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

console.log(`[SERVER] start env=${process.env.NODE_ENV || 'development'} port=${process.env.PORT || '5000'}`);

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

console.log('[SERVER] routes registered');

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

const cache = require('./utils/cache');

const MB = (bytes) => Math.round(bytes / 1024 / 1024);

setInterval(() => {
  const mem = process.memoryUsage();
  const cacheStats = cache.getStats();
  console.log('[MEMORY]', JSON.stringify({
    rss: MB(mem.rss) + 'MB',
    heapTotal: MB(mem.heapTotal) + 'MB',
    heapUsed: MB(mem.heapUsed) + 'MB',
    external: MB(mem.external) + 'MB',
    cacheKeys: cacheStats.keys,
    cacheSizeMB: cacheStats.totalSizeMB + 'MB',
  }));
}, 60000);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  console.log('[SERVER] MongoDB connected, starting HTTP server...');
  app.listen(PORT, () => {
    const memInit = MB(process.memoryUsage().rss);
    console.log(`[SERVER] started port=${PORT} mongo=connected mem=${memInit}MB cors=${allowedOrigins.length}+1`);
  });
}).catch((err) => {
    console.error(`[SERVER] failed to start mongo=${err.message}`);
  process.exit(1);
});
