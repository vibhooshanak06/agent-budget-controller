'use strict';

/**
 * agent.repository.js
 *
 * All Prisma queries for the Agent model.
 */

const { prisma } = require('../config/db');

/**
 * Create a new agent.
 * @param {object} data - Validated agent creation payload
 */
async function createAgent(data) {
  return prisma.agent.create({ data });
}

/**
 * Find an agent by its primary key.
 * @param {string} id - Agent UUID
 */
async function findAgentById(id) {
  return prisma.agent.findUnique({ where: { id } });
}

/**
 * List agents with optional filters and pagination.
 * @param {object} opts
 * @param {string}  [opts.teamId]
 * @param {string}  [opts.status]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listAgents({ teamId, status, skip, limit }) {
  const where = {};
  if (teamId) where.teamId = teamId;
  if (status) where.status = status;

  const [agents, total] = await prisma.$transaction([
    prisma.agent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { team: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.agent.count({ where }),
  ]);

  return { agents, total };
}

/**
 * Update an agent by ID.
 * @param {string} id   - Agent UUID
 * @param {object} data - Fields to update
 */
async function updateAgent(id, data) {
  return prisma.agent.update({ where: { id }, data });
}

/**
 * Atomically increment an agent's budgetUsed by a cost amount.
 *
 * @param {string} id   - Agent UUID
 * @param {number} cost - Amount to add to budgetUsed
 */
async function incrementAgentBudgetUsed(id, cost) {
  return prisma.agent.update({
    where: { id },
    data: { budgetUsed: { increment: cost } },
  });
}

/**
 * Find an agent by ID with its parent team included.
 * Used by budget checks that need both agent and team data.
 *
 * @param {string} id - Agent UUID
 */
async function findAgentWithTeam(id) {
  return prisma.agent.findUnique({
    where: { id },
    include: { team: true },
  });
}

/**
 * Delete an agent by ID.
 * Will fail with Prisma P2003 if sessions or usage logs exist (FK Restrict).
 * @param {string} id - Agent UUID
 */
async function deleteAgent(id) {
  return prisma.agent.delete({ where: { id } });
}

module.exports = {
  createAgent,
  findAgentById,
  findAgentWithTeam,
  listAgents,
  updateAgent,
  deleteAgent,
  incrementAgentBudgetUsed,
};
