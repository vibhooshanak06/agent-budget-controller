'use strict';

/**
 * metering.service.js
 *
 * ⚠️  STUB — Implementation deferred to Milestone 3.
 *
 * Responsible for:
 *   - Mapping model names to cost-per-token rates
 *   - Calculating USD cost for a given (model, promptTokens, completionTokens) tuple
 *   - Aggregating usage by time window for dashboard queries
 */

/**
 * Calculate the USD cost of a request.
 *
 * @param {string} model            - Model identifier (e.g. 'gpt-4o')
 * @param {number} promptTokens     - Number of input tokens
 * @param {number} completionTokens - Number of output tokens
 * @returns {number} Estimated cost in USD
 */
function calculateCost(model, promptTokens, completionTokens) {
  // TODO (Milestone 3): Load pricing table and compute real cost
  throw new Error('metering.service.calculateCost is not yet implemented');
}

module.exports = { calculateCost };
