'use strict';

/**
 * health.controller.js
 *
 * Handles GET /health
 * Returns server liveness information used by load balancers,
 * container orchestrators (ECS, K8s), and monitoring systems.
 */

const env = require('../config/env');

/**
 * GET /health
 */
function getHealth(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
}

module.exports = { getHealth };
