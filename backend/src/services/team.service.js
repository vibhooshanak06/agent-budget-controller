'use strict';

/**
 * team.service.js
 *
 * Business logic for Team CRUD and budget snapshot.
 */

const teamRepository = require('../repositories/team.repository');
const AppError       = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

// ── Create ────────────────────────────────────────────────────────────────────

async function createTeam(payload) {
  const existing = await teamRepository.findTeamBySlug(payload.slug);
  if (existing) {
    throw new AppError(
      `A team with slug '${payload.slug}' already exists.`,
      409,
      'CONFLICT',
    );
  }

  return teamRepository.createTeam({
    name:        payload.name,
    slug:        payload.slug,
    budgetLimit: payload.budget_limit,
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

async function listTeams(query) {
  const { page, limit, skip } = parsePagination(query);
  const { teams, total } = await teamRepository.listTeams({
    status: query.status,
    skip,
    limit,
  });
  return buildPaginatedResponse(teams, total, page, limit);
}

async function getTeamById(id) {
  const team = await teamRepository.findTeamById(id);
  if (!team) throw new AppError(`Team '${id}' not found.`, 404, 'NOT_FOUND');
  return team;
}

// ── Update ────────────────────────────────────────────────────────────────────

async function updateTeam(id, payload) {
  // Confirm the team exists before attempting an update
  await getTeamById(id);

  const data = {};
  if (payload.name         !== undefined) data.name        = payload.name;
  if (payload.budget_limit !== undefined) data.budgetLimit = payload.budget_limit;
  if (payload.status       !== undefined) data.status      = payload.status;

  if (Object.keys(data).length === 0) {
    throw new AppError('No updatable fields provided.', 400, 'NO_FIELDS');
  }

  return teamRepository.updateTeam(id, data);
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteTeam(id) {
  await getTeamById(id);
  // Prisma will enforce FK Restrict on agents — surface a meaningful error
  try {
    await teamRepository.deleteTeam(id);
  } catch (err) {
    if (err?.code === 'P2003' || err?.message?.includes('Foreign key constraint')) {
      throw new AppError(
        'Cannot delete team — it still has agents. Remove all agents first.',
        409,
        'TEAM_HAS_AGENTS',
      );
    }
    throw err;
  }
}

module.exports = { createTeam, listTeams, getTeamById, updateTeam, deleteTeam };
