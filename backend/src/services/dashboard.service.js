'use strict';

/**
 * dashboard.service.js
 *
 * Aggregates usage analytics for the React dashboard.
 * Full implementation deferred to Milestone 5.
 * Stub is in place so the route and controller work end-to-end today.
 */

/**
 * Return aggregated usage statistics.
 *
 * @param {object} query - { team_id?, from?, to? }
 */
async function getDashboardStats(query) {
  // TODO (Milestone 5): Query UsageLog and aggregate by day, team, agent, model.
  return {
    message: 'Dashboard analytics not yet implemented. Coming in Milestone 5.',
    filters: query,
    total_cost: 0,
    total_tokens: 0,
    total_requests: 0,
    top_agents: [],
    daily_breakdown: [],
  };
}

module.exports = { getDashboardStats };
