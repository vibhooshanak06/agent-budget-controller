'use strict';

/**
 * chat.service.js
 *
 * Orchestrates the chat inference pipeline.
 *
 * Current state (Milestone 2):
 *   - Validates session and agent exist
 *   - Returns a stub response (placeholder until Milestone 3)
 *
 * Future milestones will insert:
 *   - Budget check         (Milestone 3 — BudgetService)
 *   - Model routing        (Milestone 4 — ModelRouterService)
 *   - Real LLM call        (Milestone 3)
 *   - Token metering       (Milestone 3 — MeteringService)
 *   - Usage logging        (Milestone 3 — UsageLoggerService)
 *   - Session cost update  (Milestone 3)
 *   - Alert generation     (Milestone 3 — AlertService)
 */

const sessionRepository = require('../repositories/session.repository');
const agentRepository = require('../repositories/agent.repository');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Process an incoming chat request through the governance pipeline.
 *
 * @param {object} payload - { session_id, agent_id, model, prompt }
 */
async function processChat(payload) {
  const { session_id, agent_id, model, prompt } = payload;

  // ── 1. Validate session ──────────────────────────────────────────────────
  const session = await sessionRepository.findSessionById(session_id);
  if (!session) {
    throw new AppError(`Session '${session_id}' not found.`, 404, 'NOT_FOUND');
  }
  if (session.status !== 'active') {
    throw new AppError(
      `Session '${session_id}' is ${session.status} and cannot accept new requests.`,
      400,
      'SESSION_NOT_ACTIVE',
    );
  }

  // ── 2. Validate agent ────────────────────────────────────────────────────
  const agent = await agentRepository.findAgentById(agent_id);
  if (!agent) {
    throw new AppError(`Agent '${agent_id}' not found.`, 404, 'NOT_FOUND');
  }
  if (session.agentId !== agent_id) {
    throw new AppError(
      'session_id and agent_id do not match.',
      400,
      'SESSION_AGENT_MISMATCH',
    );
  }

  // ── 3. Budget check (placeholder — Milestone 3) ──────────────────────────
  // TODO: await budgetService.assertBudgetAvailable(agent);

  // ── 4. Model routing (placeholder — Milestone 4) ─────────────────────────
  // TODO: const resolvedModel = await modelRouterService.resolve(model, agent);
  const resolvedModel = model;

  // ── 5. LLM call (placeholder — Milestone 3) ──────────────────────────────
  // TODO: const llmResponse = await modelRouterService.call(resolvedModel, prompt);
  logger.info({ agentId: agent_id, sessionId: session_id, model: resolvedModel }, 'Chat request received (stub)');

  const stubResponse = {
    session_id,
    model: resolvedModel,
    response: '[Stub] LLM integration not yet implemented. This endpoint is ready for Milestone 3.',
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      cost: 0,
    },
    latency_ms: 0,
  };

  // ── 6. Usage logging (placeholder — Milestone 3) ─────────────────────────
  // TODO: await usageLoggerService.log({ session_id, agent_id, model, ...usage, latency_ms });

  return stubResponse;
}

module.exports = { processChat };
