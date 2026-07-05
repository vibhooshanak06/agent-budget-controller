'use strict';

/**
 * usageLogger.service.js
 *
 * Persists every completed LLM request and updates all cumulative counters
 * atomically in a single Prisma transaction:
 *
 *   1. INSERT into usage_logs     (immutable record — never overwritten)
 *   2. INCREMENT sessions.total_*  (token counts + cost)
 *   3. INCREMENT agents.budget_used
 *   4. INCREMENT teams.budget_used
 *
 * After the transaction commits, post-request threshold evaluation runs
 * asynchronously so that alert emission never delays the HTTP response.
 */

const { prisma }          = require('../config/db');
const usageLogRepository  = require('../repositories/usageLog.repository');
const budgetService        = require('./budget.service');
const logger               = require('../config/logger');

/**
 * Log a completed LLM request and update all cumulative counters.
 * Wrapped in a single DB transaction to guarantee consistency.
 *
 * @param {object} params
 * @param {string}  params.sessionId
 * @param {string}  params.agentId
 * @param {string}  params.teamId
 * @param {string}  params.model
 * @param {number}  params.promptTokens
 * @param {number}  params.completionTokens
 * @param {number}  params.totalTokens
 * @param {number}  params.cost              - Pre-calculated USD cost
 * @param {number}  [params.latencyMs]       - End-to-end latency in ms
 * @param {string}  [params.status]          - 'success' | 'error'
 * @returns {Promise<object>} The created UsageLog record
 */
async function logUsage({
  sessionId,
  agentId,
  teamId,
  model,
  promptTokens,
  completionTokens,
  totalTokens,
  cost,
  latencyMs = null,
  status = 'success',
}) {
  logger.info(
    { sessionId, agentId, model, promptTokens, completionTokens, cost },
    'Persisting usage log',
  );

  // Run all writes in a single transaction — either all succeed or all roll back
  const usageLog = await prisma.$transaction(async (tx) => {
    // 1. Create immutable usage log entry
    const log = await tx.usageLog.create({
      data: {
        sessionId,
        agentId,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        latencyMs,
        status,
      },
    });

    // 2. Increment session token counts and cost
    await tx.session.update({
      where: { id: sessionId },
      data: {
        totalPromptTokens:     { increment: promptTokens },
        totalCompletionTokens: { increment: completionTokens },
        totalCost:             { increment: cost },
      },
    });

    // 3. Increment agent's cumulative spend
    await tx.agent.update({
      where: { id: agentId },
      data:  { budgetUsed: { increment: cost } },
    });

    // 4. Increment team's cumulative spend
    await tx.team.update({
      where: { id: teamId },
      data:  { budgetUsed: { increment: cost } },
    });

    return log;
  });

  logger.info(
    { usageLogId: usageLog.id, cost, totalTokens },
    'Usage log persisted and budgets updated',
  );

  // Emit real-time usage event (non-blocking)
  try {
    const { getIO } = require('../config/socket');
    getIO().emit('usage_created', {
      sessionId, agentId, teamId, model, cost, totalTokens, latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (_) { /* safe */ }

  // Evaluate post-request thresholds asynchronously — must not block the response
  budgetService
    .evaluatePostRequestThresholds({ sessionId, agentId, teamId })
    .catch((err) => logger.error({ err, sessionId, agentId }, 'Post-request threshold evaluation failed'));

  return usageLog;
}

module.exports = { logUsage };
