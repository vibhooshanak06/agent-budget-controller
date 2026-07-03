'use strict';

/**
 * health.controller.js
 *
 * GET /health — liveness check for load balancers and monitoring systems.
 */

const env = require('../config/env');

function getHealth(req, res) {
  res.status(200).json({
    status:      'healthy',
    timestamp:   new Date().toISOString(),
    uptime:      process.uptime(),
    environment: env.NODE_ENV,
  });
}

module.exports = { getHealth };
