'use strict';

/**
 * alert.controller.js
 *
 * Thin HTTP layer for Alert endpoints.
 */

const alertService = require('../services/alert.service');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/v1/alerts */
const listAlerts = asyncHandler(async (req, res) => {
  const result = await alertService.listAlerts(req.query);
  res.status(200).json({ status: 'success', ...result });
});

/** PATCH /api/v1/alerts/:id/acknowledge */
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.acknowledgeAlert(req.params.id);
  res.status(200).json({ status: 'success', data: alert });
});

module.exports = { listAlerts, acknowledgeAlert };
