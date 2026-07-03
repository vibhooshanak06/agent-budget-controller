'use strict';

/**
 * team.repository.js
 *
 * All Prisma queries for the Team model.
 * Services call these methods; no other layer should query teams directly.
 */

const { prisma } = require('../config/db');

/**
 * Create a new team.
 * @param {object} data - Validated team creation payload
 */
async function createTeam(data) {
  return prisma.team.create({ data });
}

/**
 * Find a team by its primary key.
 * @param {string} id - Team UUID
 */
async function findTeamById(id) {
  return prisma.team.findUnique({ where: { id } });
}

/**
 * Find a team by its unique slug.
 * @param {string} slug
 */
async function findTeamBySlug(slug) {
  return prisma.team.findUnique({ where: { slug } });
}

/**
 * List teams with optional status filter and pagination.
 * @param {object} opts
 * @param {string}  [opts.status]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listTeams({ status, skip, limit }) {
  const where = status ? { status } : {};

  const [teams, total] = await prisma.$transaction([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.team.count({ where }),
  ]);

  return { teams, total };
}

/**
 * Update a team by ID.
 * @param {string} id   - Team UUID
 * @param {object} data - Fields to update
 */
async function updateTeam(id, data) {
  return prisma.team.update({ where: { id }, data });
}

/**
 * Delete a team by ID.
 * Will fail with Prisma P2003 if agents exist (FK Restrict).
 * @param {string} id - Team UUID
 */
async function deleteTeam(id) {
  return prisma.team.delete({ where: { id } });
}

/**
 * Atomically increment a team's budgetUsed by a cost amount.
 * Uses Prisma's increment operator to avoid read-modify-write races.
 *
 * @param {string} id   - Team UUID
 * @param {number} cost - Amount to add to budgetUsed
 */
async function incrementTeamBudgetUsed(id, cost) {
  return prisma.team.update({
    where: { id },
    data: { budgetUsed: { increment: cost } },
  });
}

module.exports = { createTeam, findTeamById, findTeamBySlug, listTeams, updateTeam, deleteTeam, incrementTeamBudgetUsed };
