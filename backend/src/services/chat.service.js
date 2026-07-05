'use strict';

/**
 * chat.service.js
 *
 * Orchestrates the complete chat inference pipeline:
 *
 *   1. Load session, agent, team (done by budgetGuard middleware before this runs)
 *   2. Call OpenAI with the resolved model
 *   3. Calculate cost from token usage
 *   4. Persist UsageLog + update all budget counters (in one transaction)
 *   5. Evaluate post-request thresholds (async — does not delay response)
 *   6. Return the LLM response to the caller
 *
 * Budget enforcement (step 1) is handled by the budgetGuard middleware
 * which runs BEFORE this service. If execution reaches here, the request
 * is already approved.
 *
 * The loaded records (session, agent, team) are attached to req by the
 * middleware and forwarded here via the payload to avoid redundant DB queries.
 */

const openaiService   = require('./openai.service');
const meteringService = require('./metering.service');
const usageLogger     = require('./usageLogger.service');
const modelRouter     = require('./modelRouter.service');
const env             = require('../config/env');
const logger          = require('../config/logger');

/**
 * Process an approved chat request through the full inference pipeline.
 *
 * @param {object} payload
 * @param {string}   payload.session_id
 * @param {string}   payload.agent_id
 * @param {string}   payload.model         - Requested model (validated by Zod)
 * @param {string}   payload.prompt
 * @param {object}   payload.session       - Pre-loaded session record (from middleware)
 * @param {object}   payload.agent         - Pre-loaded agent record with team (from middleware)
 * @param {object}   payload.team          - Pre-loaded team record (from middleware)
 * @returns {Promise<object>} Response payload for the HTTP layer
 */
async function processChat(payload) {
  const { session_id, agent_id, model, prompt, session, agent, team } = payload;

  // Resolve model: use requested model, fall back to agent preference, then env default
  const preferredModel = model || agent.modelPreference || env.DEFAULT_MODEL;

  // Apply budget-aware model substitution
  const { resolvedModel, substituted } = await modelRouter.resolveModel({
    requestedModel: preferredModel,
    agent,
    sessionId:      session_id,
  });

  logger.info(
    { sessionId: session_id, agentId: agent_id, requestedModel: preferredModel, resolvedModel, substituted },
    'Chat pipeline started',
  );

  // ── Call OpenAI ────────────────────────────────────────────────────────────
  const llmResult = await openaiService.createChatCompletion({
    model:  resolvedModel,
    prompt,
  });

  // ── Calculate cost ─────────────────────────────────────────────────────────
  const cost = meteringService.calculateCost(
    llmResult.model,          // use actual resolved model from OpenAI response
    llmResult.promptTokens,
    llmResult.completionTokens,
  );

  logger.info(
    {
      sessionId:        session_id,
      agentId:          agent_id,
      model:            llmResult.model,
      promptTokens:     llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      totalTokens:      llmResult.totalTokens,
      cost,
      latencyMs:        llmResult.latencyMs,
    },
    'LLM response received — persisting usage',
  );

  // ── Persist usage + update all budget counters ─────────────────────────────
  await usageLogger.logUsage({
    sessionId:        session_id,
    agentId:          agent_id,
    teamId:           team.id,
    model:            llmResult.model,
    promptTokens:     llmResult.promptTokens,
    completionTokens: llmResult.completionTokens,
    totalTokens:      llmResult.totalTokens,
    cost,
    latencyMs:        llmResult.latencyMs,
    status:           'success',
  });

  // ── Return response ────────────────────────────────────────────────────────
  return {
    session_id,
    model:    llmResult.model,
    response: llmResult.text,
    usage: {
      prompt_tokens:     llmResult.promptTokens,
      completion_tokens: llmResult.completionTokens,
      total_tokens:      llmResult.totalTokens,
      cost,
    },
    finish_reason:      llmResult.finishReason,
    latency_ms:         llmResult.latencyMs,
    model_substituted:  substituted,
    requested_model:    preferredModel,
  };
}

module.exports = { processChat };
