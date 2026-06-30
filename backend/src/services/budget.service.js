'use strict';

/**
 * budget.service.js
 *
 * ⚠️  STUB — Implementation deferred to Milestone 3.
 *
 * Responsible for:
 *   - Reading per-team and per-agent budget limits
 *   - Calculating remaining budget in real time
 *   - Blocking requests when the budget is exhausted
 *   - Triggering the Alert Service at configurable thresholds (50%, 80%, 100%)
 */

/**
 * Assert that an agent has sufficient remaining budget to proceed.
 * Throws AppError 402 if the budget is exhausted.
 *
 * @param {object} agent - Agent record from the database
 */
async function assertBudgetAvailable(agent) {
  // TODO (Milestone 3): Implement budget enforcement logic
  throw new Error('budget.service.assertBudgetAvailable is not yet implemented');
}

module.exports = { assertBudgetAvailable };
