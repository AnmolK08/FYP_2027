import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import { connectRedis } from './config/redis.js';
import { initSyncQueue } from './queues/leetcodeSync.queue.js';
import { startSyncWorker } from './workers/leetcodeSync.worker.js';

dotenv.config();

const app = express();

// Trust reverse proxy for secure cookies on Vercel/proxies
app.set('trust proxy', 1);

const rawFrontendUrls = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...rawFrontendUrls,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].map((url) => url.replace(/\/+$/, ''));

app.use(helmet()); 
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        (process.env.NODE_ENV !== 'production' && cleanOrigin.startsWith('http://localhost')) ||
        /https:\/\/[a-z0-9-]+\.vercel\.app$/.test(cleanOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies and auth headers
  })
);
app.use(morgan('dev')); // HTTP request logger

// Zero-dependency native cookie parser middleware (avoids docker container dependency caching issues)
app.use((req, res, next) => {
  req.cookies = req.cookies || {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (key) req.cookies[key] = decodeURIComponent(val);
    });
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lucy API is running' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverless: Boolean(process.env.VERCEL),
  });
});

app.use('/api', routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 8000;

const start = async () => {
  // Connect Redis (non-fatal if unavailable, run in background)
  connectRedis().catch((err) => console.error('Redis init failed:', err));

  // Initialise BullMQ queue & worker (requires Redis)
  initSyncQueue();
  startSyncWorker();

  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
} else {
  // In Vercel serverless environment, connect to Redis and init queue if configured
  connectRedis().catch((err) => console.error('Redis init failed:', err));
  initSyncQueue();
}

export default app;
