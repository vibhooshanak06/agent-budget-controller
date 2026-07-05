'use strict';

const modelRouterService = require('../services/modelRouter.service');
const asyncHandler       = require('../utils/asyncHandler');

/** GET /api/v1/model-substitutions */
const listSubstitutions = asyncHandler(async (req, res) => {
  const result = await modelRouterService.listSubstitutions(req.query);
  res.status(200).json({ status: 'success', ...result });
});

module.exports = { listSubstitutions };
