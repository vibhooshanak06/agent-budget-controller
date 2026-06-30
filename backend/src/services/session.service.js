'use strict';

/**
 * session.service.js
 *
 * Business logic for Session lifecycle management.
 * Budget enforcement and runaway detection will be added here in Milestone 3.
 */

const sessionRepository = require('../repositories/session.repository');
const agentRepository = require('../repositories/agent.repository');
const AppError = require('../utils/AppError');

/**
 * Open a new session for an agent.
 * Validates that the agent exists before creating the session.
 *
 * @param {object} payload - { agent_id }
 */
async function createSession(payload) {
  const agent = await agentRepository.findAgentById(payload.agent_id);
  if (!agent) {
    throw new AppError(`Agent with id '${payload.agent_id}' not found.`, 404, 'NOT_FOUND');
  }

  // TODO (Milestone 3): Block session creation if agent budget is exhausted

  const session = await sessionRepository.createSession(payload.agent_id);
  return session;
}

/**
 * Retrieve a single session by ID.
 *
 * @param {string} id - Session UUID
 */
async function getSessionById(id) {
  const session = await sessionRepository.findSessionById(id);
  if (!session) {
    throw new AppError(`Session with id '${id}' not found.`, 404, 'NOT_FOUND');
  }
  return session;
}

module.exports = { createSession, getSessionById };
