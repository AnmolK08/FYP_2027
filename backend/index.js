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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(helmet()); 
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
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

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
