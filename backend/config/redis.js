import { createClient } from 'redis';

/**
 * Redis Configuration
 * -------------------
 * Single reusable Redis connection shared across the application.
 * Exports:
 *   redisClient  – the client instance (null if REDIS_URL is not configured)
 *   isRedisReady – function returning true when the client is connected and usable
 *   connectRedis – async function to establish the connection at startup
 */

const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;
let ready = false;

/**
 * Returns true when the Redis client is connected and operational.
 * Services should check this before issuing Redis commands and fall
 * back to PostgreSQL when it returns false.
 */
export const isRedisReady = () => ready;

/**
 * Establish the Redis connection. Call once during application startup.
 * Does NOT throw — a failed Redis connection logs a warning and the
 * application continues with PostgreSQL as the sole data source.
 */
export const connectRedis = async () => {
  if (!REDIS_URL) {
    console.warn('[Redis] REDIS_URL is not set — running without Redis cache');
    return;
  }

  try {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      ready = false;
      if (err?.code === 'ECONNREFUSED') return;
      console.error('[Redis] Client error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Connected and ready');
      ready = true;
    });

    redisClient.on('reconnecting', () => {
      ready = false;
    });

    redisClient.on('end', () => {
      console.log('[Redis] Connection closed');
      ready = false;
    });

    await redisClient.connect();
  } catch (err) {
    console.error('[Redis] Failed to connect:', err.message);
    console.warn('[Redis] Application will run without Redis cache');
    redisClient = null;
    ready = false;
  }
};

/**
 * Returns the raw IORedis-compatible connection options for BullMQ.
 * BullMQ requires a raw ioredis-style connection, but since we use
 * node-redis we pass the URL string and let BullMQ create its own
 * connection internally.
 */
export const getRedisUrl = () => REDIS_URL || null;

export default redisClient;
export { redisClient };
