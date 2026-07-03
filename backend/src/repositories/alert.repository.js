'use strict';

/**
 * alert.repository.js
 *
 * All Prisma queries for the Alert model.
 */

const { prisma } = require('../config/db');

/**
 * Create a new alert.
 * @param {object} data - Alert data
 */
async function createAlert(data) {
  return prisma.alert.create({ data });
}

/**
 * List alerts with optional filters and pagination.
 * @param {object} opts
 * @param {string}  [opts.teamId]
 * @param {string}  [opts.agentId]
 * @param {boolean} [opts.acknowledged]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listAlerts({ teamId, agentId, acknowledged, skip, limit }) {
  const where = {};
  if (teamId) where.teamId = teamId;
  if (agentId) where.agentId = agentId;
  if (acknowledged !== undefined) where.acknowledged = acknowledged;

  const [alerts, total] = await prisma.$transaction([
    prisma.alert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.alert.count({ where }),
  ]);

  return { alerts, total };
}

/**
 * Acknowledge an alert by ID.
 * @param {string} id - Alert UUID
 */
async function acknowledgeAlert(id) {
  return prisma.alert.update({
    where: { id },
    data: { acknowledged: true },
  });
}

/**
 * Check whether an unacknowledged alert of a given type already exists
 * for an agent (or team). Used to prevent duplicate threshold warnings.
 *
 * @param {object} opts
 * @param {string}  opts.type     - Alert type (e.g. 'budget_warning')
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.teamId]
 * @returns {Promise<boolean>}
 */
async function existsUnacknowledged({ type, agentId, teamId }) {
  const where = { type, acknowledged: false };
  if (agentId) where.agentId = agentId;
  if (teamId) where.teamId = teamId;

  const count = await prisma.alert.count({ where });
  return count > 0;
}

module.exports = { createAlert, listAlerts, acknowledgeAlert, existsUnacknowledged };
