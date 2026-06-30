'use strict';

/**
 * agent.service.js
 *
 * Business logic for Agent operations.
 */

const agentRepository = require('../repositories/agent.repository');
const teamRepository = require('../repositories/team.repository');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

/**
 * Register a new agent under a team.
 *
 * @param {object} payload - Validated request body
 */
async function createAgent(payload) {
  // Ensure the parent team exists
  const team = await teamRepository.findTeamById(payload.team_id);
  if (!team) {
    throw new AppError(`Team with id '${payload.team_id}' not found.`, 404, 'NOT_FOUND');
  }

  const agent = await agentRepository.createAgent({
    teamId: payload.team_id,
    name: payload.name,
    slug: payload.slug,
    budgetLimit: payload.budget_limit,
    modelPreference: payload.model_preference ?? null,
  });

  return agent;
}

/**
 * List agents with optional filters and pagination.
 *
 * @param {object} query - Validated query params
 */
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

/**
 * Retrieve a single agent by ID.
 *
 * @param {string} id - Agent UUID
 */
async function getAgentById(id) {
  const agent = await agentRepository.findAgentById(id);
  if (!agent) {
    throw new AppError(`Agent with id '${id}' not found.`, 404, 'NOT_FOUND');
  }
  return agent;
}

module.exports = { createAgent, listAgents, getAgentById };
