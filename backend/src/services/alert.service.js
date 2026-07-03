'use strict';

/**
 * alert.service.js
 *
 * Handles alert creation, deduplication, retrieval, and acknowledgement.
 *
 * Alert types:
 *   budget_warning   — utilization reached the warning threshold (e.g. 80%)
 *   budget_exceeded  — utilization reached 100%; requests are now blocked
 *   session_closed   — a session was closed because its budget was exhausted
 */

const alertRepository = require('../repositories/alert.repository');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');
const logger = require('../config/logger');

// ── Alert type constants ──────────────────────────────────────────────────────

const ALERT_TYPES = {
  BUDGET_WARNING:  'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  SESSION_CLOSED:  'session_closed',
};

const ALERT_SEVERITY = {
  INFO:     'info',
  WARNING:  'warning',
  CRITICAL: 'critical',
};

// ── Creation helpers ──────────────────────────────────────────────────────────

/**
 * Emit a budget WARNING alert (80% threshold crossed).
 * Deduplicates — will not create a second alert if an unacknowledged one
 * already exists for the same entity and type.
 *
 * @param {object} opts
 * @param {'agent'|'team'|'session'} opts.scope
 * @param {string}  opts.entityId   - UUID of the agent or team
 * @param {string}  opts.entityName - Display name for the message
 * @param {number}  opts.utilization - Current utilization ratio (0–1)
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.teamId]
 */
async function emitBudgetWarning({ scope, entityId, entityName, utilization, agentId, teamId }) {
  const alreadyExists = await alertRepository.existsUnacknowledged({
    type: ALERT_TYPES.BUDGET_WARNING,
    agentId: agentId ?? null,
    teamId:  teamId  ?? null,
  });

  if (alreadyExists) {
    logger.debug({ scope, entityId }, 'Budget warning alert already exists — skipping duplicate');
    return null;
  }

  const pct = Math.round(utilization * 100);
  const message = `${scope === 'team' ? 'Team' : 'Agent'} "${entityName}" has used ${pct}% of its budget.`;

  const alert = await alertRepository.createAlert({
    type:     ALERT_TYPES.BUDGET_WARNING,
    severity: ALERT_SEVERITY.WARNING,
    message,
    agentId:  agentId ?? null,
    teamId:   teamId  ?? null,
  });

  logger.warn({ alertId: alert.id, scope, entityId, pct }, 'Budget warning alert created');
  return alert;
}

/**
 * Emit a BUDGET EXCEEDED alert (100% — requests are now blocked).
 * Deduplicates against existing unacknowledged exceeded alerts.
 *
 * @param {object} opts
 * @param {'agent'|'team'|'session'} opts.scope
 * @param {string}  opts.entityName
 * @param {string}  [opts.agentId]
 * @param {string}  [opts.teamId]
 */
async function emitBudgetExceeded({ scope, entityName, agentId, teamId }) {
  const alreadyExists = await alertRepository.existsUnacknowledged({
    type: ALERT_TYPES.BUDGET_EXCEEDED,
    agentId: agentId ?? null,
    teamId:  teamId  ?? null,
  });

  if (alreadyExists) {
    logger.debug({ scope, entityName }, 'Budget exceeded alert already exists — skipping duplicate');
    return null;
  }

  const message = `${scope === 'team' ? 'Team' : 'Agent'} "${entityName}" has exhausted its budget. All requests are now blocked.`;

  const alert = await alertRepository.createAlert({
    type:     ALERT_TYPES.BUDGET_EXCEEDED,
    severity: ALERT_SEVERITY.CRITICAL,
    message,
    agentId:  agentId ?? null,
    teamId:   teamId  ?? null,
  });

  logger.error({ alertId: alert.id, scope, entityName }, 'Budget exceeded alert created');
  return alert;
}

/**
 * Emit a SESSION CLOSED alert.
 *
 * @param {object} opts
 * @param {string} opts.sessionId  - The closed session UUID
 * @param {string} opts.agentId
 * @param {string} opts.agentName
 */
async function emitSessionClosed({ sessionId, agentId, agentName }) {
  const message = `Session "${sessionId}" for agent "${agentName}" was automatically closed because its budget was exhausted.`;

  const alert = await alertRepository.createAlert({
    type:     ALERT_TYPES.SESSION_CLOSED,
    severity: ALERT_SEVERITY.WARNING,
    message,
    agentId,
    teamId: null,
  });

  logger.warn({ alertId: alert.id, sessionId, agentId }, 'Session closed alert created');
  return alert;
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

/**
 * List alerts with optional filters and pagination.
 *
 * @param {object} query - Validated query params
 */
async function listAlerts(query) {
  const { page, limit, skip } = parsePagination(query);

  let acknowledged;
  if (query.acknowledged !== undefined) {
    acknowledged = query.acknowledged === 'true' || query.acknowledged === true;
  }

  const { alerts, total } = await alertRepository.listAlerts({
    teamId:       query.team_id,
    agentId:      query.agent_id,
    acknowledged,
    skip,
    limit,
  });

  return buildPaginatedResponse(alerts, total, page, limit);
}

/**
 * Acknowledge an alert by ID.
 *
 * @param {string} id - Alert UUID
 */
async function acknowledgeAlert(id) {
  return alertRepository.acknowledgeAlert(id);
}

module.exports = {
  emitBudgetWarning,
  emitBudgetExceeded,
  emitSessionClosed,
  listAlerts,
  acknowledgeAlert,
  ALERT_TYPES,
  ALERT_SEVERITY,
};
