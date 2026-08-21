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

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Global Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Register all routes
app.use('/api', routes);

// Error Handling Middleware (must be registered last)
app.use(errorMiddleware);

// Handle server startup
const PORT = process.env.PORT || 3000;

const start = async () => {
  // Connect Redis (non-fatal if unavailable, run in background)
  connectRedis().catch(err => console.error('Redis init failed:', err));

  // Initialise BullMQ queue & worker (requires Redis)
  initSyncQueue();
  startSyncWorker();

  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
