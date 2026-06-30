'use strict';

/**
 * session.repository.js
 *
 * All Prisma queries for the Session model.
 */

const { prisma } = require('../config/db');

/**
 * Create a new session for an agent.
 * @param {string} agentId - Agent UUID
 */
async function createSession(agentId) {
  return prisma.session.create({
    data: { agentId },
  });
}

/**
 * Find a session by its primary key.
 * @param {string} id - Session UUID
 */
async function findSessionById(id) {
  return prisma.session.findUnique({ where: { id } });
}

/**
 * Update a session by ID (e.g. accumulate tokens, change status).
 * @param {string} id   - Session UUID
 * @param {object} data - Fields to update
 */
async function updateSession(id, data) {
  return prisma.session.update({ where: { id }, data });
}

/**
 * Close a session (set status to 'closed' and record ended_at).
 * @param {string} id - Session UUID
 */
async function closeSession(id) {
  return prisma.session.update({
    where: { id },
    data: { status: 'closed', endedAt: new Date() },
  });
}

module.exports = { createSession, findSessionById, updateSession, closeSession };
