'use strict';

/**
 * runawayDetection.service.js
 *
 * Hourly job checks every agent.
 * If an agent's spend in the last hour exceeds RUNAWAY_THRESHOLD_PCT% of
 * its monthly budget (approximated as budgetLimit), the agent is paused,
 * an alert is generated, and future requests are blocked until manually resumed.
 *
 * Monthly budget is approximated as budgetLimit (the configured cap).
 * A "runaway" spend rate = hourly_cost / budget_limit > threshold.
 */

const { prisma }    = require('../config/db');
const agentRepo     = require('../repositories/agent.repository');
const alertService  = require('./alert.service');
const env           = require('../config/env');
const logger        = require('../config/logger');

const RUNAWAY_ALERT_TYPE = 'runaway_detected';

/**
 * Run the runaway detection scan across all active agents.
 * Called by the hourly cron job.
 */
async function runScan() {
  logger.info('Runaway detection scan started');
  const threshold = (env.RUNAWAY_THRESHOLD_PCT || 20) / 100;
  const since     = new Date(Date.now() - 60 * 60 * 1000); // last 1 hour

  // Fetch all active agents
  const agents = await prisma.agent.findMany({
    where:  { status: 'active' },
    select: { id: true, name: true, teamId: true, budgetLimit: true },
  });

  let detected = 0;

  for (const agent of agents) {
    const limit = parseFloat(agent.budgetLimit) || 0;
    if (limit <= 0) continue; // no budget set — skip

    // Sum spend from usage_logs in the last hour
    const agg = await prisma.usageLog.aggregate({
      where:  { agentId: agent.id, createdAt: { gte: since }, status: 'success' },
      _sum:   { cost: true },
    });

    const hourlySpend = parseFloat(agg._sum.cost ?? 0);
    const ratio       = hourlySpend / limit;

    if (ratio >= threshold) {
      detected++;
      logger.warn(
        { agentId: agent.id, hourlySpend, limit, ratio: ratio.toFixed(4) },
        `Runaway agent detected: ${agent.name}`,
      );

      // Pause the agent
      await prisma.agent.update({
        where: { id: agent.id },
        data:  { status: 'blocked' },
      });

      // Create alert (skip if unacknowledged runaway alert already exists)
      const alreadyAlerting = await prisma.alert.count({
        where: { agentId: agent.id, type: RUNAWAY_ALERT_TYPE, acknowledged: false },
      });

      if (!alreadyAlerting) {
        await prisma.alert.create({
          data: {
            agentId:  agent.id,
            teamId:   agent.teamId,
            type:     RUNAWAY_ALERT_TYPE,
            severity: 'critical',
            message:  `Runaway agent detected: "${agent.name}" spent $${hourlySpend.toFixed(6)} in the last hour (${Math.round(ratio * 100)}% of monthly budget). Agent paused.`,
          },
        });
      }

      // Emit WebSocket event
      try {
        const { getIO } = require('../config/socket');
        getIO().emit('runaway_detected', {
          agentId:     agent.id,
          agentName:   agent.name,
          hourlySpend,
          budgetLimit: limit,
          ratio:       Math.round(ratio * 100),
          timestamp:   new Date().toISOString(),
        });
      } catch (_) { /* safe */ }
    }
  }

  logger.info({ scanned: agents.length, detected }, 'Runaway detection scan complete');
  return { scanned: agents.length, detected };
}

/**
 * Manually resume a paused agent (clears blocked status + acknowledges alerts).
 * @param {string} agentId
 */
async function resumeAgent(agentId) {
  await prisma.$transaction([
    prisma.agent.update({ where: { id: agentId }, data: { status: 'active' } }),
    prisma.alert.updateMany({
      where: { agentId, type: RUNAWAY_ALERT_TYPE, acknowledged: false },
      data:  { acknowledged: true },
    }),
  ]);

  logger.info({ agentId }, 'Agent manually resumed after runaway detection');
}

module.exports = { runScan, resumeAgent };
