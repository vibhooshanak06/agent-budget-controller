'use strict';

/**
 * redis.js — Optional Redis client.
 * If Redis is unavailable the app continues without caching.
 * All exported functions are safe no-ops when Redis is down.
 */

const Redis  = require('ioredis');
const env    = require('./env');
const logger = require('./logger');

let redisClient  = null;
let redisHealthy = false;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest:    1,
      enableReadyCheck:        false,
      lazyConnect:             true,
      connectTimeout:          3000,
      commandTimeout:          2000,
      retryStrategy:           () => null,   // don't retry — fail fast
      reconnectOnError:        () => false,
    });

    redisClient.on('connect',      () => { redisHealthy = true;  logger.info('Redis connected'); });
    redisClient.on('ready',        () => { redisHealthy = true; });
    redisClient.on('error',        ()  => { redisHealthy = false; });
    redisClient.on('close',        ()  => { redisHealthy = false; });
    redisClient.on('reconnecting', ()  => { redisHealthy = false; });
  }
  return redisClient;
}

async function connectRedis() {
  try {
    const client = getRedis();
    await client.connect();
    logger.info('✅  Redis connection established — caching enabled');
  } catch {
    redisHealthy = false;
    logger.warn('⚠️   Redis unavailable — caching disabled (app continues normally)');
  }
}

async function disconnectRedis() {
  if (redisClient) {
    try { await redisClient.quit(); } catch { /* ignore */ }
    redisClient  = null;
    redisHealthy = false;
    logger.info('Redis disconnected');
  }
}

/** Safe GET — returns null if Redis is unavailable */
async function cacheGet(key) {
  if (!redisHealthy) return null;
  try {
    const val = await getRedis().get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/** Safe SET with TTL — silently skips if Redis is unavailable */
async function cacheSet(key, value, ttlSeconds = env.REDIS_TTL_SECONDS) {
  if (!redisHealthy) return;
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
}

/** Safe DEL */
async function cacheDel(key) {
  if (!redisHealthy) return;
  try { await getRedis().del(key); } catch { /* non-fatal */ }
}

/** Safe DEL by pattern */
async function cacheDelPattern(pattern) {
  if (!redisHealthy) return;
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length) await getRedis().del(...keys);
  } catch { /* non-fatal */ }
}

module.exports = {
  getRedis,
  connectRedis,
  disconnectRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};
