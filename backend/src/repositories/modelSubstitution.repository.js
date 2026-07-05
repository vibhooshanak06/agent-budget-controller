'use strict';

/**
 * modelSubstitution.repository.js
 *
 * All Prisma queries for the ModelSubstitution model.
 */

const { prisma } = require('../config/db');

/**
 * Record a model substitution event.
 * @param {object} data - Substitution data
 */
async function createSubstitution(data) {
  return prisma.modelSubstitution.create({ data });
}

/**
 * List substitutions with optional filters and pagination.
 * @param {object} opts
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.sessionId]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listSubstitutions({ agentId, sessionId, skip, limit }) {
  const where = {};
  if (agentId) where.agentId = agentId;
  if (sessionId) where.sessionId = sessionId;

  const [substitutions, total] = await prisma.$transaction([
    prisma.modelSubstitution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.modelSubstitution.count({ where }),
  ]);

  return { substitutions, total };
}

/**
 * Count substitutions in a time window for a specific agent.
 * @param {string} agentId
 * @param {Date}   since
 */
async function countSubstitutionsSince(agentId, since) {
  return prisma.modelSubstitution.count({
    where: { agentId, createdAt: { gte: since } },
  });
}

module.exports = { createSubstitution, listSubstitutions, countSubstitutionsSince };
