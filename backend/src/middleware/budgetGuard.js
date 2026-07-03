'use strict';

/**
 * budgetGuard.js
 *
 * Pre-request budget enforcement middleware.
 * Must be applied to routes that forward requests to LLM providers.
 *
 * Execution order:
 *   1. Extract session_id and agent_id from req.body
 *   2. Validate both IDs are present (Zod schema already enforces this,
 *      but we guard defensively here too)
 *   3. Call budgetService.assertRequestAllowed() which:
 *        a. Loads session, agent (with team) from DB
 *        b. Checks session status (closed/terminated → 403)
 *        c. Checks agent budget     (exhausted → 403, warning → alert)
 *        d. Checks team budget      (exhausted → 403, warning → alert)
 *   4. On success: attach { session, agent, team } to req for use downstream
 *   5. On failure: forward AppError to the centralised error handler
 *
 * Attaching the loaded records to req avoids redundant DB queries in the
 * service layer — the chat.service.js can use req.budgetContext directly.
 */

const budgetService  = require('../services/budget.service');
const asyncHandler   = require('../utils/asyncHandler');
const logger         = require('../config/logger');

const budgetGuard = asyncHandler(async (req, res, next) => {
  const { session_id, agent_id } = req.body;

  // Defensive check — Zod validation runs before this middleware on /chat
  if (!session_id || !agent_id) {
    return next(); // let Zod's error surface normally
  }

  logger.debug({ sessionId: session_id, agentId: agent_id }, 'Budget guard: checking budgets');

  // assertRequestAllowed throws AppError if any check fails
  const { session, agent, team } = await budgetService.assertRequestAllowed(
    session_id,
    agent_id,
  );

  // Attach pre-loaded records to req so chat.service.js doesn't re-query
  req.budgetContext = { session, agent, team };

  logger.debug(
    {
      sessionId:   session_id,
      agentId:     agent_id,
      teamId:      team.id,
      agentBudget: `${parseFloat(agent.budgetUsed).toFixed(4)}/${parseFloat(agent.budgetLimit).toFixed(4)}`,
      teamBudget:  `${parseFloat(team.budgetUsed).toFixed(4)}/${parseFloat(team.budgetLimit).toFixed(4)}`,
    },
    'Budget guard: request approved',
  );

  return next();
});

module.exports = budgetGuard;
