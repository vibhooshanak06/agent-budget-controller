'use strict';

/**
 * modelFallbacks.js
 *
 * Configurable fallback chains for each model.
 * Rules:
 *  - Fallbacks must belong to the same provider as the requested model.
 *  - Fallbacks are tried in order (index 0 first).
 *  - Each tier is associated with a budget utilization threshold above which
 *    the fallback is activated.
 *
 * To add a new model or change the chain, only edit this file.
 * Business logic lives in modelRouter.service.js — never here.
 */

/**
 * @typedef {object} FallbackTier
 * @property {number} threshold  - Utilization ratio (0–1) above which this fallback activates
 * @property {string} model      - The fallback model to use
 */

/** @type {Record<string, FallbackTier[]>} */
const MODEL_FALLBACK_CHAINS = {
  // ── GPT-4o family ─────────────────────────────────────────────────────────
  'gpt-4o': [
    { threshold: 0.70, model: 'gpt-4o-mini' },
    { threshold: 0.90, model: 'gpt-3.5-turbo' },
  ],
  'gpt-4o-mini': [
    { threshold: 0.90, model: 'gpt-3.5-turbo' },
  ],

  // ── GPT-4 Turbo ───────────────────────────────────────────────────────────
  'gpt-4-turbo': [
    { threshold: 0.70, model: 'gpt-4o' },
    { threshold: 0.80, model: 'gpt-4o-mini' },
    { threshold: 0.90, model: 'gpt-3.5-turbo' },
  ],
  'gpt-4-turbo-preview': [
    { threshold: 0.70, model: 'gpt-4o' },
    { threshold: 0.80, model: 'gpt-4o-mini' },
    { threshold: 0.90, model: 'gpt-3.5-turbo' },
  ],

  // ── GPT-3.5 ───────────────────────────────────────────────────────────────
  'gpt-3.5-turbo': [],   // cheapest OpenAI model — no fallback
  'gpt-3.5-turbo-0125': [],

  // ── Anthropic ─────────────────────────────────────────────────────────────
  'claude-3-5-sonnet-20241022': [
    { threshold: 0.70, model: 'claude-3-haiku-20240307' },
  ],
  'claude-3-haiku-20240307': [], // cheapest Claude model — no fallback
};

/**
 * Return the fallback chain for a model (empty array = no fallback).
 * @param {string} model
 * @returns {FallbackTier[]}
 */
function getFallbackChain(model) {
  return MODEL_FALLBACK_CHAINS[model] ?? [];
}

module.exports = { MODEL_FALLBACK_CHAINS, getFallbackChain };
