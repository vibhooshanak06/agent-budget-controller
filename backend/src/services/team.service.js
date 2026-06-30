'use strict';

/**
 * team.service.js
 *
 * Business logic for Team operations.
 * All domain decisions (duplicate check, status rules, etc.) live here.
 * Controllers stay thin — they just call service methods.
 */

const teamRepository = require('../repositories/team.repository');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

/**
 * Create a new team.
 * Validates slug uniqueness before attempting the insert.
 *
 * @param {object} payload - Validated request body
 */
async function createTeam(payload) {
  const existing = await teamRepository.findTeamBySlug(payload.slug);
  if (existing) {
    throw new AppError(
      `A team with slug '${payload.slug}' already exists.`,
      409,
      'CONFLICT',
    );
  }

  const team = await teamRepository.createTeam({
    name: payload.name,
    slug: payload.slug,
    budgetLimit: payload.budget_limit,
  });

  return team;
}

/**
 * List teams with pagination.
 *
 * @param {object} query - Validated query params
 */
async function listTeams(query) {
  const { page, limit, skip } = parsePagination(query);
  const { teams, total } = await teamRepository.listTeams({
    status: query.status,
    skip,
    limit,
  });

  return buildPaginatedResponse(teams, total, page, limit);
}

/**
 * Retrieve a single team by ID.
 *
 * @param {string} id - Team UUID
 */
async function getTeamById(id) {
  const team = await teamRepository.findTeamById(id);
  if (!team) {
    throw new AppError(`Team with id '${id}' not found.`, 404, 'NOT_FOUND');
  }
  return team;
}

module.exports = { createTeam, listTeams, getTeamById };
