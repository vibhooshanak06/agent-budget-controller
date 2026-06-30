'use strict';

/**
 * alert.service.js
 *
 * Business logic for Alert management.
 * Alert generation is triggered by BudgetService (Milestone 3).
 * This service handles retrieval and acknowledgement.
 */

const alertRepository = require('../repositories/alert.repository');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

/**
 * List alerts with optional filters and pagination.
 *
 * @param {object} query - Validated query params
 */
async function listAlerts(query) {
  const { page, limit, skip } = parsePagination(query);

  // Convert acknowledged query string to boolean when present
  let acknowledged;
  if (query.acknowledged !== undefined) {
    acknowledged = query.acknowledged === 'true' || query.acknowledged === true;
  }

  const { alerts, total } = await alertRepository.listAlerts({
    teamId: query.team_id,
    agentId: query.agent_id,
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
  // Will throw Prisma P2025 (→ mapped to 404) if not found
  const alert = await alertRepository.acknowledgeAlert(id);
  return alert;
}

module.exports = { listAlerts, acknowledgeAlert };
