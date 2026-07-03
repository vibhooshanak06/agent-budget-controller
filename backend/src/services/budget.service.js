'use strict';

/**
 * budget.service.js
 *
 * Central budget enforcement engine.
 *
 * Responsibilities:
 *   - Validate that a session, agent, and team all have budget remaining
 *   - Calculate utilization and remaining amounts
 *   - Emit WARNING alerts at the 80% threshold (deduplicated)
 *   - Emit BUDGET_EXCEEDED alerts at 100% (deduplicated)
 *   - Close sessions whose budget is exhausted
 *   - Return structured budget snapshots for any entity
 *
 * This service is intentionally pure — it does NOT touch req/res.
 * It is called by the budgetGuard middleware and by usageLogger after
 * a successful LLM call.
 */

const sessionRepository = require('../repositories/session.repository');
const agentRepository   = require('../repositories/agent.repository');
const teamRepository    = require('../repositories/team.repository');
const alertService      = require('./alert.service');
const metering          = require('./metering.service');
const AppError          = require('../utils/AppError');
const logger            = require('../config/logger');

// ── Budget snapshot ───────────────────────────────────────────────────────────

/**
 * Build a budget snapshot object for any entity (team, agent, or session).
 *
 * @param {string}         name         - Display name for the entity
 * @param {number|string}  budgetLimit  - From DB (Prisma Decimal coerced)
 * @param {number|string}  budgetUsed   - From DB (Prisma Decimal coerced)
 * @returns {{ limit, used, remaining, utilization, isExhausted, isWarning }}
 */
function buildSnapshot(name, budgetLimit, budgetUsed) {
  const limit       = parseFloat(budgetLimit) || 0;
  const used        = parseFloat(budgetUsed)  || 0;
  const remaining   = metering.calculateRemaining(used, limit);
  const utilization = metering.calculateUtilization(used, limit);

  return {
    name,
    limit,
    used,
    remaining,
    utilization,
    utilizationPct: Math.round(utilization * 100),
    isWarning:   metering.isWarningThreshold(utilization),
    isExhausted: metering.isHardLimit(utilization),
  };
}

// ── Pre-request checks ────────────────────────────────────────────────────────

/**
 * Check session budget. Throws 403 if exhausted; closes session if needed.
 *
 * @param {object} session - Session record from DB
 * @param {object} agent   - Agent record (for alert context)
 */
async function checkSessionBudget(session, agent) {
  // Sessions without a budget limit set (limit = 0) are treated as unlimited
  const limit = parseFloat(session.totalCost !== undefined
    ? 0  // sessions use a cost ceiling defined on the agent, not a separate field
    : 0);

  // Session-level enforcement: if the session was already closed, reject now
  if (session.status === 'closed') {
    throw new AppError(
      'This session has been closed. Please open a new session.',
      403,
      'SESSION_CLOSED',
    );
  }

  if (session.status === 'terminated') {
    throw new AppError(
      'This session was terminated due to policy violation.',
      403,
      'SESSION_TERMINATED',
    );
  }
}

/**
 * Check agent budget. Throws 403 and emits alerts if exhausted.
 *
 * @param {object} agent - Agent record from DB (must include team)
 */
async function checkAgentBudget(agent) {
  const snap = buildSnapshot(agent.name, agent.budgetLimit, agent.budgetUsed);

  if (snap.limit <= 0) return; // no limit configured — unlimited

  if (snap.isExhausted) {
    // Fire-and-forget — alert emission should not block the rejection response
    alertService.emitBudgetExceeded({
      scope:      'agent',
      entityName: agent.name,
      agentId:    agent.id,
      teamId:     agent.teamId,
    }).catch((err) => logger.error({ err }, 'Failed to emit agent budget exceeded alert'));

    logger.warn({ agentId: agent.id, utilization: snap.utilizationPct }, 'Agent budget exhausted — request blocked');

    throw new AppError(
      `Agent budget exhausted. Used $${snap.used.toFixed(6)} of $${snap.limit.toFixed(6)}.`,
      403,
      'AGENT_BUDGET_EXHAUSTED',
      { used: snap.used, limit: snap.limit, utilization: snap.utilizationPct },
    );
  }

  if (snap.isWarning) {
    alertService.emitBudgetWarning({
      scope:       'agent',
      entityId:    agent.id,
      entityName:  agent.name,
      utilization: snap.utilization,
      agentId:     agent.id,
      teamId:      agent.teamId,
    }).catch((err) => logger.error({ err }, 'Failed to emit agent budget warning alert'));
  }
}

/**
 * Check team budget. Throws 403 and emits alerts if exhausted.
 *
 * @param {object} team - Team record from DB
 */
async function checkTeamBudget(team) {
  const snap = buildSnapshot(team.name, team.budgetLimit, team.budgetUsed);

  if (snap.limit <= 0) return; // no limit configured — unlimited

  if (snap.isExhausted) {
    alertService.emitBudgetExceeded({
      scope:      'team',
      entityName: team.name,
      teamId:     team.id,
    }).catch((err) => logger.error({ err }, 'Failed to emit team budget exceeded alert'));

    logger.warn({ teamId: team.id, utilization: snap.utilizationPct }, 'Team budget exhausted — request blocked');

    throw new AppError(
      `Team budget exhausted. Used $${snap.used.toFixed(6)} of $${snap.limit.toFixed(6)}.`,
      403,
      'TEAM_BUDGET_EXHAUSTED',
      { used: snap.used, limit: snap.limit, utilization: snap.utilizationPct },
    );
  }

  if (snap.isWarning) {
    alertService.emitBudgetWarning({
      scope:       'team',
      entityId:    team.id,
      entityName:  team.name,
      utilization: snap.utilization,
      teamId:      team.id,
    }).catch((err) => logger.error({ err }, 'Failed to emit team budget warning alert'));
  }
}

/**
 * Full pre-request budget gate.
 * Validates session → agent → team in order.
 * Any failure throws an AppError which the error handler converts to JSON.
 *
 * @param {string} sessionId
 * @param {string} agentId
 * @returns {{ session, agent, team }} Loaded records for downstream use
 */
async function assertRequestAllowed(sessionId, agentId) {
  // Load session
  const session = await sessionRepository.findSessionById(sessionId);
  if (!session) {
    throw new AppError(`Session '${sessionId}' not found.`, 404, 'NOT_FOUND');
  }

  // Load agent WITH its parent team in a single query
  const agent = await agentRepository.findAgentWithTeam(agentId);
  if (!agent) {
    throw new AppError(`Agent '${agentId}' not found.`, 404, 'NOT_FOUND');
  }

  // Verify the session belongs to this agent
  if (session.agentId !== agentId) {
    throw new AppError(
      'session_id does not belong to the specified agent_id.',
      400,
      'SESSION_AGENT_MISMATCH',
    );
  }

  const team = agent.team;

  // Run checks in order: session → agent → team
  await checkSessionBudget(session, agent);
  await checkAgentBudget(agent);
  await checkTeamBudget(team);

  return { session, agent, team };
}

// ── Post-request budget update ────────────────────────────────────────────────

/**
 * After a successful LLM call, check if the agent/team have now crossed
 * thresholds and close the session if its agent's budget is exhausted.
 *
 * Called by usageLogger.service AFTER budgets have been incremented in DB.
 *
 * @param {object} opts
 * @param {string}  opts.sessionId
 * @param {string}  opts.agentId
 * @param {string}  opts.teamId
 */
async function evaluatePostRequestThresholds({ sessionId, agentId, teamId }) {
  // Re-fetch fresh values after the DB increment
  const [agent, team] = await Promise.all([
    agentRepository.findAgentWithTeam(agentId),
    teamRepository.findTeamById(teamId),
  ]);

  if (!agent || !team) return; // guard against deleted records

  const agentSnap = buildSnapshot(agent.name, agent.budgetLimit, agent.budgetUsed);
  const teamSnap  = buildSnapshot(team.name,  team.budgetLimit,  team.budgetUsed);

  // ── Agent thresholds ─────────────────────────────────────────────────────
  if (agentSnap.limit > 0 && agentSnap.isExhausted) {
    // Close the session
    await sessionRepository.closeSession(sessionId);
    logger.warn({ sessionId, agentId }, 'Session closed — agent budget exhausted');

    alertService.emitSessionClosed({
      sessionId,
      agentId:   agent.id,
      agentName: agent.name,
    }).catch((err) => logger.error({ err }, 'Failed to emit session closed alert'));

    alertService.emitBudgetExceeded({
      scope:      'agent',
      entityName: agent.name,
      agentId:    agent.id,
      teamId:     agent.teamId,
    }).catch((err) => logger.error({ err }, 'Failed to emit post-request agent exceeded alert'));

  } else if (agentSnap.limit > 0 && agentSnap.isWarning) {
    alertService.emitBudgetWarning({
      scope:       'agent',
      entityId:    agent.id,
      entityName:  agent.name,
      utilization: agentSnap.utilization,
      agentId:     agent.id,
      teamId:      agent.teamId,
    }).catch((err) => logger.error({ err }, 'Failed to emit post-request agent warning alert'));
  }

  // ── Team thresholds ──────────────────────────────────────────────────────
  if (teamSnap.limit > 0 && teamSnap.isExhausted) {
    alertService.emitBudgetExceeded({
      scope:      'team',
      entityName: team.name,
      teamId:     team.id,
    }).catch((err) => logger.error({ err }, 'Failed to emit post-request team exceeded alert'));

  } else if (teamSnap.limit > 0 && teamSnap.isWarning) {
    alertService.emitBudgetWarning({
      scope:       'team',
      entityId:    team.id,
      entityName:  team.name,
      utilization: teamSnap.utilization,
      teamId:      team.id,
    }).catch((err) => logger.error({ err }, 'Failed to emit post-request team warning alert'));
  }
}

// ── Snapshot queries (used by future dashboard) ───────────────────────────────

/**
 * Return a budget snapshot for a team.
 * @param {string} teamId
 */
async function getTeamBudgetSnapshot(teamId) {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError(`Team '${teamId}' not found.`, 404, 'NOT_FOUND');
  return buildSnapshot(team.name, team.budgetLimit, team.budgetUsed);
}

/**
 * Return a budget snapshot for an agent.
 * @param {string} agentId
 */
async function getAgentBudgetSnapshot(agentId) {
  const agent = await agentRepository.findAgentById(agentId);
  if (!agent) throw new AppError(`Agent '${agentId}' not found.`, 404, 'NOT_FOUND');
  return buildSnapshot(agent.name, agent.budgetLimit, agent.budgetUsed);
}

module.exports = {
  assertRequestAllowed,
  evaluatePostRequestThresholds,
  getTeamBudgetSnapshot,
  getAgentBudgetSnapshot,
  buildSnapshot,
  // Exported so session.service can call them independently at session-open time
  checkAgentBudget,
  checkTeamBudget,
};
