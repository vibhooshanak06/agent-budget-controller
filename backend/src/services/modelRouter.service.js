'use strict';

/**
 * modelRouter.service.js
 *
 * Responsible for:
 *   1. Resolving which model should actually be used for a request
 *      (applying fallback chain if budget pressure is detected)
 *   2. Recording every substitution in the database for audit
 *   3. Emitting a model_substituted event via Socket.IO
 *
 * Fallback logic is driven entirely by config/modelFallbacks.js.
 * This service contains zero hardcoded model names.
 */

const { getFallbackChain }         = require('../config/modelFallbacks');
const { calculateUtilization }     = require('./metering.service');
const modelSubstitutionRepository  = require('../repositories/modelSubstitution.repository');
const { buildPaginatedResponse }   = require('../utils/pagination');
const logger                       = require('../config/logger');

// ── Resolve model ─────────────────────────────────────────────────────────────

/**
 * Determine which model to use for a request.
 * Walks the fallback chain of the requested model and returns the first
 * fallback whose threshold has been exceeded by the agent's current utilization.
 *
 * If no fallback threshold is exceeded the requested model is used as-is.
 *
 * @param {object} opts
 * @param {string}  opts.requestedModel - The model the caller wants to use
 * @param {object}  opts.agent          - Agent record (must include budgetLimit, budgetUsed)
 * @param {string}  [opts.sessionId]    - Current session ID (for audit record)
 * @returns {Promise<{ resolvedModel: string, substituted: boolean }>}
 */
async function resolveModel({ requestedModel, agent, sessionId = null }) {
  const utilization = calculateUtilization(agent.budgetUsed, agent.budgetLimit);
  const chain       = getFallbackChain(requestedModel);

  // Walk the chain in reverse — pick the most aggressive substitution that applies
  let resolvedModel = requestedModel;
  let matchedTier   = null;

  for (const tier of chain) {
    if (utilization >= tier.threshold) {
      resolvedModel = tier.model;
      matchedTier   = tier;
    }
  }

  const substituted = resolvedModel !== requestedModel;

  if (substituted) {
    const pct = Math.round(utilization * 100);

    logger.info(
      {
        agentId:        agent.id,
        requestedModel,
        resolvedModel,
        utilization:    pct,
        threshold:      matchedTier.threshold,
      },
      `Model substituted: ${requestedModel} → ${resolvedModel} at ${pct}% utilization`,
    );

    // Persist the substitution record (non-blocking — do not delay the request)
    modelSubstitutionRepository
      .createSubstitution({
        agentId:        agent.id,
        sessionId:      sessionId || null,
        requestedModel,
        resolvedModel,
        reason:         `budget_pressure_${Math.round(matchedTier.threshold * 100)}pct`,
        utilization,
      })
      .catch((err) => logger.error({ err }, 'Failed to persist model substitution'));

    // Emit real-time event (io injected at server startup — graceful no-op if absent)
    try {
      const { getIO } = require('../config/socket');
      getIO().emit('model_substituted', {
        agentId:        agent.id,
        requestedModel,
        resolvedModel,
        utilization:    pct,
        timestamp:      new Date().toISOString(),
      });
    } catch (_) { /* Socket.IO not yet initialised — safe to ignore */ }
  }

  return { resolvedModel, substituted };
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

/**
 * List model substitution history.
 * @param {object} query - { agent_id?, session_id?, page?, limit? }
 */
async function listSubstitutions(query) {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip  = (page - 1) * limit;

  const { substitutions, total } = await modelSubstitutionRepository.listSubstitutions({
    agentId:   query.agent_id,
    sessionId: query.session_id,
    skip,
    limit,
  });

  return buildPaginatedResponse(substitutions, total, page, limit);
}

module.exports = { resolveModel, listSubstitutions };
