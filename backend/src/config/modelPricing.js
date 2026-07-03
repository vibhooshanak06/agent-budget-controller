'use strict';

/**
 * modelPricing.js
 *
 * Centralised LLM model pricing table.
 * All costs are expressed in USD per 1,000 tokens.
 *
 * To add a new model or update prices, only this file needs to change —
 * no service or business logic should ever hardcode token costs.
 *
 * Source: OpenAI pricing page (https://openai.com/pricing) — July 2025.
 * Update this file whenever OpenAI publishes new pricing.
 */

/**
 * @typedef {object} ModelPrice
 * @property {number} inputPer1k  - USD cost per 1,000 prompt (input) tokens
 * @property {number} outputPer1k - USD cost per 1,000 completion (output) tokens
 */

/** @type {Record<string, ModelPrice>} */
const MODEL_PRICING = {
  // ── GPT-4o family ──────────────────────────────────────────────────────────
  'gpt-4o': {
    inputPer1k: 0.005,
    outputPer1k: 0.015,
  },
  'gpt-4o-mini': {
    inputPer1k: 0.00015,
    outputPer1k: 0.0006,
  },

  // ── GPT-4 Turbo ───────────────────────────────────────────────────────────
  'gpt-4-turbo': {
    inputPer1k: 0.01,
    outputPer1k: 0.03,
  },
  'gpt-4-turbo-preview': {
    inputPer1k: 0.01,
    outputPer1k: 0.03,
  },

  // ── GPT-3.5 ───────────────────────────────────────────────────────────────
  'gpt-3.5-turbo': {
    inputPer1k: 0.0005,
    outputPer1k: 0.0015,
  },
  'gpt-3.5-turbo-0125': {
    inputPer1k: 0.0005,
    outputPer1k: 0.0015,
  },

  // ── Anthropic (future providers) ─────────────────────────────────────────
  'claude-3-5-sonnet-20241022': {
    inputPer1k: 0.003,
    outputPer1k: 0.015,
  },
  'claude-3-haiku-20240307': {
    inputPer1k: 0.00025,
    outputPer1k: 0.00125,
  },
};

/**
 * Fallback pricing used when a model is not listed above.
 * Conservative (higher) estimate to avoid undercharging.
 */
const FALLBACK_PRICING = {
  inputPer1k: 0.01,
  outputPer1k: 0.03,
};

/**
 * Retrieve pricing for a model. Falls back to FALLBACK_PRICING for unknown models.
 *
 * @param {string} model - Model identifier
 * @returns {ModelPrice}
 */
function getPricing(model) {
  return MODEL_PRICING[model] ?? FALLBACK_PRICING;
}

/**
 * Return the full pricing table (used by dashboard / admin endpoints).
 *
 * @returns {Record<string, ModelPrice>}
 */
function getAllPricing() {
  return { ...MODEL_PRICING };
}

module.exports = { getPricing, getAllPricing, MODEL_PRICING, FALLBACK_PRICING };
