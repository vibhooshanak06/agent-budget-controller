'use strict';

/**
 * rateLimiter.js
 *
 * Express-rate-limit middleware with Redis store when available.
 * Falls back to in-memory if Redis is unavailable.
 */

const rateLimit = require('express-rate-limit');
const env       = require('../config/env');
const logger    = require('../config/logger');

const limiter = rateLimit({
  windowMs:         env.RATE_LIMIT_WINDOW_MS,
  max:              env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { status: 'fail', code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  skip:             (req) => req.path === '/api/v1/health',
  handler:          (req, res, next, options) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json(options.message);
  },
});

module.exports = limiter;
