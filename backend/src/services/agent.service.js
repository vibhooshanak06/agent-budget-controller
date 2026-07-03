'use strict';

/**
 * agent.service.js
 *
 * Business logic for Agent CRUD.
 */

const agentRepository = require('../repositories/agent.repository');
const teamRepository  = require('../repositories/team.repository');
const AppError        = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

// ── Create ────────────────────────────────────────────────────────────────────

async function createAgent(payload) {
  const team = await teamRepository.findTeamById(payload.team_id);
  if (!team) {
    throw new AppError(`Team '${payload.team_id}' not found.`, 404, 'NOT_FOUND');
  }

  return agentRepository.createAgent({
    teamId:          payload.team_id,
    name:            payload.name,
    slug:            payload.slug,
    budgetLimit:     payload.budget_limit,
    modelPreference: payload.model_preference ?? null,
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

async function listAgents(query) {
  const { page, limit, skip } = parsePagination(query);
  const { agents, total } = await agentRepository.listAgents({
    teamId: query.team_id,
    status: query.status,
    skip,
    limit,
  });
  return buildPaginatedResponse(agents, total, page, limit);
}

async function getAgentById(id) {
  const agent = await agentRepository.findAgentById(id);
  if (!agent) throw new AppError(`Agent '${id}' not found.`, 404, 'NOT_FOUND');
  return agent;
}

// ── Update ────────────────────────────────────────────────────────────────────

async function updateAgent(id, payload) {
  await getAgentById(id);

  const data = {};
  if (payload.name             !== undefined) data.name            = payload.name;
  if (payload.budget_limit     !== undefined) data.budgetLimit     = payload.budget_limit;
  if (payload.model_preference !== undefined) data.modelPreference = payload.model_preference;
  if (payload.status           !== undefined) data.status          = payload.status;

  if (Object.keys(data).length === 0) {
    throw new AppError('No updatable fields provided.', 400, 'NO_FIELDS');
  }

  return agentRepository.updateAgent(id, data);
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteAgent(id) {
  await getAgentById(id);
  try {
    await agentRepository.deleteAgent(id);
  } catch (err) {
    if (err?.code === 'P2003' || err?.message?.includes('Foreign key constraint')) {
      throw new AppError(
        'Cannot delete agent — it has existing sessions or usage logs.',
        409,
        'AGENT_HAS_SESSIONS',
      );
    }
    throw err;
  }
}

module.exports = { createAgent, listAgents, getAgentById, updateAgent, deleteAgent };
