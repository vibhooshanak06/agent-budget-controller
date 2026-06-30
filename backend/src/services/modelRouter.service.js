'use strict';

/**
 * modelRouter.service.js
 *
 * ⚠️  STUB — Implementation deferred to Milestone 4.
 *
 * Responsible for:
 *   - Abstracting provider-specific APIs (OpenAI, Anthropic, AWS Bedrock)
 *   - Routing requests to the correct provider based on model name
 *   - Substituting a cheaper model when budget is low
 *   - Retrying on provider failures with configurable fallback logic
 */

/**
 * Resolve the model to use for a request.
 * May substitute a cheaper model if the agent is near its budget limit.
 *
 * @param {string} requestedModel - Model requested by the agent
 * @param {object} agent          - Agent record (used for budget-aware substitution)
 * @returns {string} The model that should actually be used
 */
async function resolveModel(requestedModel, agent) {
  // TODO (Milestone 4): Implement model substitution logic
  throw new Error('modelRouter.service.resolveModel is not yet implemented');
}

/**
 * Send a prompt to the resolved LLM and return the raw provider response.
 *
 * @param {string} model  - Resolved model identifier
 * @param {string} prompt - User prompt
 * @returns {object} Provider response with text and token counts
 */
async function callLLM(model, prompt) {
  // TODO (Milestone 3): Implement provider-agnostic LLM call
  throw new Error('modelRouter.service.callLLM is not yet implemented');
}

module.exports = { resolveModel, callLLM };
