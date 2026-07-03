'use strict';

/**
 * metering.service.js
 *
 * Responsible for all token accounting and cost calculation.
 * Prices are read exclusively from config/modelPricing.js — never hardcoded here.
 */

const { getPricing } = require('../config/modelPricing');

// ── Constants ─────────────────────────────────────────────────────────────────

/** Budget threshold that triggers a WARNING alert (0–1 scale) */
const WARNING_THRESHOLD = 0.80;

/** Budget threshold at which requests are blocked (0–1 scale) */
const HARD_LIMIT_THRESHOLD = 1.00;

// ── Core calculations ─────────────────────────────────────────────────────────

/**
 * Calculate the USD cost for a single LLM request.
 *
 * @param {string} model            - Model identifier (e.g. 'gpt-4o-mini')
 * @param {number} promptTokens     - Number of input tokens
 * @param {number} completionTokens - Number of output tokens
 * @returns {number} Estimated cost in USD (rounded to 6 decimal places)
 */
function calculateCost(model, promptTokens, completionTokens) {
  const pricing = getPricing(model);

  const inputCost  = (promptTokens / 1000) * pricing.inputPer1k;
  const outputCost = (completionTokens / 1000) * pricing.outputPer1k;
  const total      = inputCost + outputCost;

  // Round to 6 decimal places — matches DECIMAL(12,6) in the schema
  return Math.round(total * 1_000_000) / 1_000_000;
}

/**
 * Calculate the utilization ratio (0–1+) for a budget holder.
 *
 * @param {number|string} budgetUsed  - Amount spent so far (Prisma Decimal → coerce)
 * @param {number|string} budgetLimit - Maximum allowed spend (Prisma Decimal → coerce)
 * @returns {number} Ratio, e.g. 0.85 means 85%. Returns 0 if limit is 0.
 */
function calculateUtilization(budgetUsed, budgetLimit) {
  const used  = parseFloat(budgetUsed)  || 0;
  const limit = parseFloat(budgetLimit) || 0;

  if (limit <= 0) return 0;
  return used / limit;
}

/**
 * Calculate the remaining budget.
 *
 * @param {number|string} budgetUsed
 * @param {number|string} budgetLimit
 * @returns {number} Remaining USD (minimum 0)
 */
function calculateRemaining(budgetUsed, budgetLimit) {
  const used  = parseFloat(budgetUsed)  || 0;
  const limit = parseFloat(budgetLimit) || 0;
  return Math.max(0, limit - used);
}

/**
 * Check whether a given spend delta would exhaust the budget.
 *
 * @param {number|string} budgetUsed
 * @param {number|string} budgetLimit
 * @param {number}        cost - Proposed additional spend
 * @returns {boolean}
 */
function wouldExceedBudget(budgetUsed, budgetLimit, cost) {
  const remaining = calculateRemaining(budgetUsed, budgetLimit);
  return cost > remaining;
}

/**
 * Determine whether the WARNING threshold has been crossed.
 *
 * @param {number} utilizationRatio - Value from calculateUtilization()
 * @returns {boolean}
 */
function isWarningThreshold(utilizationRatio) {
  return utilizationRatio >= WARNING_THRESHOLD && utilizationRatio < HARD_LIMIT_THRESHOLD;
}

/**
 * Determine whether the HARD LIMIT has been reached.
 *
 * @param {number} utilizationRatio - Value from calculateUtilization()
 * @returns {boolean}
 */
function isHardLimit(utilizationRatio) {
  return utilizationRatio >= HARD_LIMIT_THRESHOLD;
}

module.exports = {
  calculateCost,
  calculateUtilization,
  calculateRemaining,
  wouldExceedBudget,
  isWarningThreshold,
  isHardLimit,
  WARNING_THRESHOLD,
  HARD_LIMIT_THRESHOLD,
};
