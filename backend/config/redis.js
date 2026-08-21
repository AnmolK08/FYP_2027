import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;
let ready = false;

export const isRedisReady = () => ready;

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

export const getRedisUrl = () => REDIS_URL || null;

export default redisClient;
export { redisClient };
