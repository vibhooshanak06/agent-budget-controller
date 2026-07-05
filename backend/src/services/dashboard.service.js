'use strict';

/**
 * dashboard.service.js
 *
 * Aggregated analytics for the React dashboard.
 * SQLite-compatible — no PostgreSQL-specific raw SQL.
 * Redis caching is used when available (gracefully skipped when Redis is down).
 */

const { prisma }         = require('../config/db');
const { cacheGet, cacheSet } = require('../config/redis');
const env                = require('../config/env');
const logger             = require('../config/logger');

const CACHE_TTL = env.REDIS_TTL_SECONDS || 60;

// ── Cache helpers ─────────────────────────────────────────────────────────────

function cacheKey(...parts) {
  return `dashboard:${parts.join(':')}`;
}

async function cached(key, ttl, fetcher) {
  const hit = await cacheGet(key);
  if (hit !== null) return hit;
  const data = await fetcher();
  await cacheSet(key, data, ttl);
  return data;
}

// ── Main overview ─────────────────────────────────────────────────────────────

async function getDashboardStats(query) {
  const { team_id, from, to } = query;
  const key = cacheKey('overview', team_id || 'all', from || '', to || '');

  return cached(key, CACHE_TTL, async () => {
    const dateFilter = buildDateFilter(from, to);

    const [
      teamSummaries,
      topAgents,
      recentUsage,
      recentAlerts,
      modelBreakdown,
      dailyUsage,
      hourlyUsage,
      blockedCount,
      substitutionCount,
      runawayCount,
    ] = await Promise.all([
      getTeamSummaries(team_id),
      getTopSpendingAgents(team_id, dateFilter, 10),
      getRecentUsage(team_id, dateFilter, 20),
      getRecentAlerts(team_id, 10),
      getModelBreakdown(team_id, dateFilter),
      getDailyUsage(team_id, from, to),
      getHourlyUsage(team_id),
      getBlockedRequestCount(team_id, dateFilter),
      getSubstitutionCount(team_id, dateFilter),
      getRunawayAgentCount(team_id),
    ]);

    const totalCost   = teamSummaries.reduce((s, t) => s + t.budgetUsed, 0);
    const totalBudget = teamSummaries.reduce((s, t) => s + t.budgetLimit, 0);

    return {
      summary: {
        totalCost:          parseFloat(totalCost.toFixed(6)),
        totalBudget:        parseFloat(totalBudget.toFixed(6)),
        remaining:          parseFloat(Math.max(0, totalBudget - totalCost).toFixed(6)),
        utilization:        totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0,
        totalRequests:      recentUsage.total || 0,
        blockedRequests:    blockedCount,
        modelSubstitutions: substitutionCount,
        runawayAgents:      runawayCount,
      },
      teams:       teamSummaries,
      topAgents,
      recentUsage: recentUsage.logs,
      recentAlerts,
      modelBreakdown,
      dailyUsage,
      hourlyUsage,
    };
  });
}

// ── Team summaries ─────────────────────────────────────────────────────────────

async function getTeamSummaries(teamId) {
  const where = { status: 'active' };
  if (teamId) where.id = teamId;

  const teams = await prisma.team.findMany({
    where,
    include: {
      agents: {
        select: { id: true, name: true, slug: true, budgetLimit: true, budgetUsed: true, status: true },
      },
    },
  });

  return teams.map((t) => ({
    id:          t.id,
    name:        t.name,
    slug:        t.slug,
    budgetLimit: parseFloat(t.budgetLimit),
    budgetUsed:  parseFloat(t.budgetUsed),
    remaining:   parseFloat(Math.max(0, t.budgetLimit - t.budgetUsed)),
    utilization: parseFloat(t.budgetLimit) > 0
      ? Math.round((parseFloat(t.budgetUsed) / parseFloat(t.budgetLimit)) * 100)
      : 0,
    agentCount: t.agents.length,
    agents:     t.agents.map((a) => ({
      id:          a.id,
      name:        a.name,
      slug:        a.slug,
      budgetLimit: parseFloat(a.budgetLimit),
      budgetUsed:  parseFloat(a.budgetUsed),
      remaining:   parseFloat(Math.max(0, a.budgetLimit - a.budgetUsed)),
      utilization: parseFloat(a.budgetLimit) > 0
        ? Math.round((parseFloat(a.budgetUsed) / parseFloat(a.budgetLimit)) * 100)
        : 0,
      status: a.status,
    })),
  }));
}

// ── Top spending agents ────────────────────────────────────────────────────────

async function getTopSpendingAgents(teamId, dateFilter, limit = 10) {
  const where = {};
  if (teamId) where.agent = { teamId };
  if (dateFilter) where.createdAt = dateFilter;

  const agg = await prisma.usageLog.groupBy({
    by:      ['agentId'],
    where,
    _sum:    { cost: true, totalTokens: true },
    _count:  { id: true },
    orderBy: { _sum: { cost: 'desc' } },
    take:    limit,
  });

  const agentIds = agg.map((r) => r.agentId);
  const agents   = await prisma.agent.findMany({
    where:  { id: { in: agentIds } },
    select: { id: true, name: true, slug: true, budgetLimit: true, budgetUsed: true },
  });
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return agg.map((r) => ({
    agentId:     r.agentId,
    agentName:   agentMap[r.agentId]?.name ?? 'Unknown',
    totalCost:   parseFloat((r._sum.cost ?? 0).toString()),
    totalTokens: r._sum.totalTokens ?? 0,
    requests:    r._count.id,
  }));
}

// ── Recent usage ───────────────────────────────────────────────────────────────

async function getRecentUsage(teamId, dateFilter, limit = 20) {
  const where = {};
  if (teamId) where.agent = { teamId };
  if (dateFilter) where.createdAt = dateFilter;

  const [logs, total] = await prisma.$transaction([
    prisma.usageLog.findMany({
      where,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true, slug: true } } },
    }),
    prisma.usageLog.count({ where }),
  ]);

  return { logs, total };
}

// ── Recent alerts ──────────────────────────────────────────────────────────────

async function getRecentAlerts(teamId, limit = 10) {
  const where = { acknowledged: false };
  if (teamId) where.teamId = teamId;

  return prisma.alert.findMany({
    where,
    take:    limit,
    orderBy: { createdAt: 'desc' },
  });
}

// ── Model breakdown ────────────────────────────────────────────────────────────

async function getModelBreakdown(teamId, dateFilter) {
  const where = {};
  if (teamId) where.agent = { teamId };
  if (dateFilter) where.createdAt = dateFilter;

  const agg = await prisma.usageLog.groupBy({
    by:      ['model'],
    where,
    _sum:    { cost: true, totalTokens: true },
    _count:  { id: true },
    orderBy: { _sum: { cost: 'desc' } },
  });

  return agg.map((r) => ({
    model:       r.model,
    totalCost:   parseFloat((r._sum.cost ?? 0).toString()),
    totalTokens: r._sum.totalTokens ?? 0,
    requests:    r._count.id,
  }));
}

// ── Daily usage — SQLite-compatible ───────────────────────────────────────────
// Uses Prisma's ORM layer + JS aggregation instead of raw SQL with DATE_TRUNC.

async function getDailyUsage(teamId, from, to) {
  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate   = to   ? new Date(to)   : new Date();

  const where = {
    status:    'success',
    createdAt: { gte: startDate, lte: endDate },
  };
  if (teamId) where.agent = { teamId };

  const logs = await prisma.usageLog.findMany({
    where,
    select: { cost: true, totalTokens: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date (YYYY-MM-DD) in JS
  const byDate = {};
  for (const log of logs) {
    const d = log.createdAt.toISOString().slice(0, 10);
    if (!byDate[d]) byDate[d] = { totalCost: 0, totalTokens: 0, requests: 0 };
    byDate[d].totalCost   += parseFloat(log.cost);
    byDate[d].totalTokens += log.totalTokens;
    byDate[d].requests    += 1;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => ({
      date,
      totalCost:   parseFloat(row.totalCost.toFixed(6)),
      totalTokens: row.totalTokens,
      requests:    row.requests,
    }));
}

// ── Hourly usage (last 24 hours) — SQLite-compatible ──────────────────────────

async function getHourlyUsage(teamId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where = {
    status:    'success',
    createdAt: { gte: since },
  };
  if (teamId) where.agent = { teamId };

  const logs = await prisma.usageLog.findMany({
    where,
    select: { cost: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by hour bucket in JS
  const byHour = {};
  for (const log of logs) {
    const d   = log.createdAt;
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).toISOString();
    if (!byHour[key]) byHour[key] = { totalCost: 0, requests: 0 };
    byHour[key].totalCost += parseFloat(log.cost);
    byHour[key].requests  += 1;
  }

  return Object.entries(byHour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, row]) => ({
      hour,
      totalCost: parseFloat(row.totalCost.toFixed(6)),
      requests:  row.requests,
    }));
}

// ── Blocked requests ───────────────────────────────────────────────────────────

async function getBlockedRequestCount(teamId, dateFilter) {
  const where = { status: 'blocked' };
  if (teamId) where.agent = { teamId };
  if (dateFilter) where.createdAt = dateFilter;
  return prisma.usageLog.count({ where });
}

// ── Substitutions ──────────────────────────────────────────────────────────────

async function getSubstitutionCount(teamId, dateFilter) {
  const where = {};
  if (teamId) where.agent = { teamId };
  if (dateFilter) where.createdAt = dateFilter;
  return prisma.modelSubstitution.count({ where });
}

// ── Runaway agents ─────────────────────────────────────────────────────────────

async function getRunawayAgentCount(teamId) {
  const where = { type: 'runaway_detected', acknowledged: false };
  if (teamId) where.teamId = teamId;
  return prisma.alert.count({ where });
}

// ── Date filter helper ─────────────────────────────────────────────────────────

function buildDateFilter(from, to) {
  if (!from && !to) return null;
  const filter = {};
  if (from) filter.gte = new Date(from);
  if (to)   filter.lte = new Date(to);
  return filter;
}

module.exports = { getDashboardStats, getTeamSummaries, getTopSpendingAgents };
