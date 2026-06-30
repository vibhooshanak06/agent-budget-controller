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

module.exports = { createAlert, listAlerts, acknowledgeAlert };
