'use strict';

/**
 * session.service.js
 *
 * Business logic for Session lifecycle management.
 * Budget enforcement at session creation prevents opening a session
 * when the agent's budget is already exhausted.
 */

const sessionRepository = require('../repositories/session.repository');
const agentRepository   = require('../repositories/agent.repository');
const budgetService     = require('./budget.service');
const AppError          = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

// ── Create ────────────────────────────────────────────────────────────────────

async function createSession(payload) {
  const agent = await agentRepository.findAgentWithTeam(payload.agent_id);
  if (!agent) {
    throw new AppError(`Agent '${payload.agent_id}' not found.`, 404, 'NOT_FOUND');
  }

  // Block session creation when the agent budget is already exhausted
  await budgetService.checkAgentBudget(agent);
  await budgetService.checkTeamBudget(agent.team);

  return sessionRepository.createSession(payload.agent_id);
}

// ── Read ──────────────────────────────────────────────────────────────────────

async function getSessionById(id) {
  const session = await sessionRepository.findSessionById(id);
  if (!session) throw new AppError(`Session '${id}' not found.`, 404, 'NOT_FOUND');
  return session;
}

async function listSessions(query) {
  const { page, limit, skip } = parsePagination(query);
  const { sessions, total } = await sessionRepository.listSessions({
    agentId: query.agent_id,
    status:  query.status,
    skip,
    limit,
  });
  return buildPaginatedResponse(sessions, total, page, limit);
}

// ── Close (manual) ────────────────────────────────────────────────────────────

async function closeSession(id) {
  const session = await getSessionById(id);

  if (session.status === 'closed') {
    throw new AppError('Session is already closed.', 400, 'SESSION_ALREADY_CLOSED');
  }

  return sessionRepository.closeSession(id);
}

module.exports = { createSession, getSessionById, listSessions, closeSession };
