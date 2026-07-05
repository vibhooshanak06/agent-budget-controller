'use strict';

const runawayService = require('../services/runawayDetection.service');
const asyncHandler   = require('../utils/asyncHandler');

/** POST /api/v1/agents/:id/resume */
const resumeAgent = asyncHandler(async (req, res) => {
  await runawayService.resumeAgent(req.params.id);
  res.status(200).json({ status: 'success', message: 'Agent resumed successfully.' });
});

/** POST /api/v1/admin/runaway-scan (manual trigger for testing) */
const triggerScan = asyncHandler(async (req, res) => {
  const result = await runawayService.runScan();
  res.status(200).json({ status: 'success', data: result });
});

module.exports = { resumeAgent, triggerScan };
