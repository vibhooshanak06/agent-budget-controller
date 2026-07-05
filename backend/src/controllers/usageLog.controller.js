'use strict';

const { prisma }         = require('../config/db');
const { buildPaginatedResponse, parsePagination } = require('../utils/pagination');
const asyncHandler       = require('../utils/asyncHandler');

/** GET /api/v1/usage-logs */
const listUsageLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.agent_id)   where.agentId   = req.query.agent_id;
  if (req.query.session_id) where.sessionId = req.query.session_id;
  if (req.query.model)      where.model      = req.query.model;

  const [logs, total] = await prisma.$transaction([
    prisma.usageLog.findMany({
      where,
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true, slug: true } } },
    }),
    prisma.usageLog.count({ where }),
  ]);

  res.status(200).json({ status: 'success', ...buildPaginatedResponse(logs, total, page, limit) });
});

module.exports = { listUsageLogs };
