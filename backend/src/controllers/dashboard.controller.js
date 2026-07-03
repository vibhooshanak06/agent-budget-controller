'use strict';

/**
 * dashboard.controller.js
 *
 * Thin HTTP layer for GET /dashboard (aggregated analytics).
 * Full implementation deferred to Milestone 5 — stub response returned for now.
 */

const dashboardService = require('../services/dashboard.service');
const asyncHandler     = require('../utils/asyncHandler');

/** GET /api/v1/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.query);
  res.status(200).json({ status: 'success', data: stats });
});

module.exports = { getDashboard };
