'use strict';

/**
 * scheduler.js
 *
 * Background job scheduler using node-cron.
 * All schedule expressions come from environment variables so they're
 * reconfigurable without code changes.
 *
 * Jobs:
 *   1. Runaway detection   — hourly (default: 0 * * * *)
 *   2. Expired session cleanup — daily  (default: 0 2 * * *)
 *   3. Old alert cleanup   — daily  (default: 0 2 * * *)
 *   4. Monthly budget reset— monthly (default: 0 0 1 * *)
 */

const cron      = require('node-cron');
const env       = require('../config/env');
const logger    = require('../config/logger');
const { prisma } = require('../config/db');
const { runScan } = require('../services/runawayDetection.service');

let jobs = [];

function startScheduler() {
  // ── Job 1: Hourly runaway detection ────────────────────────────────────
  const runawayJob = cron.schedule(env.CRON_RUNAWAY_DETECTION, async () => {
    logger.info('CRON: runaway detection starting');
    try {
      const result = await runScan();
      logger.info({ result }, 'CRON: runaway detection complete');
    } catch (err) {
      logger.error({ err }, 'CRON: runaway detection failed');
    }
  });

  // ── Job 2: Expired session cleanup ─────────────────────────────────────
  const sessionCleanupJob = cron.schedule(env.CRON_DAILY_CLEANUP, async () => {
    logger.info('CRON: session cleanup starting');
    try {
      // Close any sessions that have been "active" for > 24 hours (stale)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await prisma.session.updateMany({
        where:  { status: 'active', startedAt: { lt: cutoff } },
        data:   { status: 'closed', endedAt: new Date() },
      });
      logger.info({ closed: result.count }, 'CRON: stale sessions closed');
    } catch (err) {
      logger.error({ err }, 'CRON: session cleanup failed');
    }
  });

  // ── Job 3: Acknowledged alert cleanup ──────────────────────────────────
  const alertCleanupJob = cron.schedule(env.CRON_DAILY_CLEANUP, async () => {
    logger.info('CRON: alert cleanup starting');
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      const result = await prisma.alert.deleteMany({
        where: { acknowledged: true, createdAt: { lt: cutoff } },
      });
      logger.info({ deleted: result.count }, 'CRON: old alerts cleaned up');
    } catch (err) {
      logger.error({ err }, 'CRON: alert cleanup failed');
    }
  });

  // ── Job 4: Monthly budget reset ─────────────────────────────────────────
  // Resets budgetUsed to 0 for all teams and agents that have a budget set.
  // Only runs if ENABLE_MONTHLY_RESET=true to prevent accidental resets.
  const monthlyResetJob = cron.schedule(env.CRON_MONTHLY_RESET, async () => {
    if (process.env.ENABLE_MONTHLY_RESET !== 'true') {
      logger.info('CRON: monthly reset skipped (ENABLE_MONTHLY_RESET not set)');
      return;
    }
    logger.info('CRON: monthly budget reset starting');
    try {
      const [teams, agents] = await prisma.$transaction([
        prisma.team.updateMany({ where: { budgetLimit: { gt: 0 } }, data: { budgetUsed: 0 } }),
        prisma.agent.updateMany({ where: { budgetLimit: { gt: 0 } }, data: { budgetUsed: 0 } }),
      ]);
      logger.info({ teams: teams.count, agents: agents.count }, 'CRON: monthly budget reset complete');
    } catch (err) {
      logger.error({ err }, 'CRON: monthly budget reset failed');
    }
  });

  jobs = [runawayJob, sessionCleanupJob, alertCleanupJob, monthlyResetJob];
  logger.info('Background scheduler started (%d jobs)', jobs.length);
}

function stopScheduler() {
  jobs.forEach((j) => j.stop());
  jobs = [];
  logger.info('Background scheduler stopped');
}

module.exports = { startScheduler, stopScheduler };
