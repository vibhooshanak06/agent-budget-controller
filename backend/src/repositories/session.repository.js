'use strict';

/**
 * session.repository.js
 *
 * All Prisma queries for the Session model.
 */

const { prisma } = require('../config/db');

/**
 * Create a new session for an agent.
 * @param {string} agentId - Agent UUID
 */
async function createSession(agentId) {
  return prisma.session.create({
    data: { agentId },
  });
}

/**
 * Find a session by its primary key.
 * @param {string} id - Session UUID
 */
async function findSessionById(id) {
  return prisma.session.findUnique({ where: { id } });
}

/**
 * Update a session by ID (e.g. accumulate tokens, change status).
 * @param {string} id   - Session UUID
 * @param {object} data - Fields to update
 */
async function updateSession(id, data) {
  return prisma.session.update({ where: { id }, data });
}

/**
 * Close a session (set status to 'closed' and record ended_at).
 * @param {string} id - Session UUID
 */
async function closeSession(id) {
  return prisma.session.update({
    where: { id },
    data: { status: 'closed', endedAt: new Date() },
  });
}

/**
 * Atomically increment a session's token counts and cost.
 *
 * @param {string} id                  - Session UUID
 * @param {number} promptTokens        - Prompt tokens to add
 * @param {number} completionTokens    - Completion tokens to add
 * @param {number} cost                - Cost to add
 */
async function incrementSessionUsage(id, promptTokens, completionTokens, cost) {
  return prisma.session.update({
    where: { id },
    data: {
      totalPromptTokens:     { increment: promptTokens },
      totalCompletionTokens: { increment: completionTokens },
      totalCost:             { increment: cost },
    },
  });
}

/**
 * Find all active sessions for an agent.
 * @param {string} agentId - Agent UUID
 */
async function findActiveSessionsByAgent(agentId) {
  return prisma.session.findMany({
    where: { agentId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * List sessions with optional filters and pagination.
 * @param {object} opts
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.status]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listSessions({ agentId, status, skip, limit }) {
  const where = {};
  if (agentId) where.agentId = agentId;
  if (status)  where.status  = status;

  const [sessions, total] = await prisma.$transaction([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.count({ where }),
  ]);

  return { sessions, total };
}

module.exports = {
  createSession,
  findSessionById,
  updateSession,
  closeSession,
  incrementSessionUsage,
  findActiveSessionsByAgent,
  listSessions,
};
