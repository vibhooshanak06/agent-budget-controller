'use strict';

/**
 * chat.controller.js
 *
 * Thin HTTP layer for the POST /chat inference endpoint.
 * Budget enforcement has already run in the budgetGuard middleware.
 * This controller simply passes the validated body + budget context to the service.
 */

const chatService    = require('../services/chat.service');
const asyncHandler   = require('../utils/asyncHandler');

/**
 * POST /api/v1/chat
 *
 * req.body        — validated by Zod (session_id, agent_id, model, prompt)
 * req.budgetContext — attached by budgetGuard middleware { session, agent, team }
 */
const chat = asyncHandler(async (req, res) => {
  const result = await chatService.processChat({
    ...req.body,
    // Spread pre-loaded records so the service doesn't re-query the DB
    ...req.budgetContext,
  });

  res.status(200).json({ status: 'success', data: result });
});

module.exports = { chat };
