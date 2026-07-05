'use strict';

/**
 * health.controller.js — extended health endpoints
 */

const { prisma }           = require('../config/db');
const { getRedis }         = require('../config/redis');
const OpenAI               = require('openai');
const env                  = require('../config/env');
const asyncHandler         = require('../utils/asyncHandler');

/** GET /health */
function getHealth(req, res) {
  res.status(200).json({
    status:      'healthy',
    timestamp:   new Date().toISOString(),
    uptime:      process.uptime(),
    environment: env.NODE_ENV,
    version:     '2.0.0',
  });
}

/** GET /health/database */
const getDbHealth = asyncHandler(async (req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', latencyMs: Date.now() - start });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message, latencyMs: Date.now() - start });
  }
});

/** GET /health/redis */
const getRedisHealth = asyncHandler(async (req, res) => {
  const start = Date.now();
  try {
    const redis = getRedis();
    await redis.ping();
    res.json({ status: 'healthy', latencyMs: Date.now() - start });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message, latencyMs: Date.now() - start });
  }
});

/** GET /health/openai */
const getOpenAIHealth = asyncHandler(async (req, res) => {
  const start = Date.now();
  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 5000, maxRetries: 0 });
    await client.models.list({ limit: 1 });
    res.json({ status: 'healthy', latencyMs: Date.now() - start });
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err?.status === 401) {
      res.status(503).json({ status: 'unhealthy', error: 'Invalid API key', latencyMs });
    } else {
      res.status(503).json({ status: 'degraded', error: err.message, latencyMs });
    }
  }
});

module.exports = { getHealth, getDbHealth, getRedisHealth, getOpenAIHealth };
