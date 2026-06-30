'use strict';

/**
 * usageLogger.service.js
 *
 * ⚠️  STUB — Implementation deferred to Milestone 3.
 *
 * Responsible for:
 *   - Persisting each LLM request/response as an immutable UsageLog entry
 *   - Updating the Session's cumulative token and cost totals
 *   - Updating the Agent's and Team's budgetUsed fields
 */

/**
 * Log a completed LLM request and update all cumulative counters.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} params.agentId
 * @param {string} params.model
 * @param {number} params.promptTokens
 * @param {number} params.completionTokens
 * @param {number} params.cost
 * @param {number} params.latencyMs
 * @param {string} params.status
 */
async function logUsage(params) {
  // TODO (Milestone 3): Persist to UsageLog and update Session, Agent, Team counters
  throw new Error('usageLogger.service.logUsage is not yet implemented');
}

module.exports = { logUsage };
