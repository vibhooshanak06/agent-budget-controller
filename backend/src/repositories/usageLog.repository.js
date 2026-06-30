'use strict';

/**
 * usageLog.repository.js
 *
 * All Prisma queries for the UsageLog model.
 * Business logic for cost calculation belongs in the Metering Service (future).
 * This repository only handles persistence.
 */

const { prisma } = require('../config/db');

/**
 * Insert a new usage log entry.
 * @param {object} data - Log data including sessionId, agentId, tokens, cost, etc.
 */
async function createUsageLog(data) {
  return prisma.usageLog.create({ data });
}

/**
 * List usage logs with optional filters and pagination.
 * @param {object} opts
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.sessionId]
 * @param {number}  opts.skip
 * @param {number}  opts.limit
 */
async function listUsageLogs({ agentId, sessionId, skip, limit }) {
  const where = {};
  if (agentId) where.agentId = agentId;
  if (sessionId) where.sessionId = sessionId;

  const [logs, total] = await prisma.$transaction([
    prisma.usageLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.usageLog.count({ where }),
  ]);

  return { logs, total };
}

module.exports = { createUsageLog, listUsageLogs };
