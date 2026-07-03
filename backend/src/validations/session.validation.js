'use strict';

/**
 * session.validation.js
 *
 * Zod schemas for all Session endpoint request shapes.
 */

const { z } = require('zod');

// ── POST /sessions ────────────────────────────────────────────────────────────

const createSessionSchema = z.object({
  agent_id: z.string().uuid('agent_id must be a valid UUID'),
});

// ── GET /sessions (query params) ──────────────────────────────────────────────

const listSessionsQuerySchema = z.object({
  agent_id: z.string().uuid().optional(),
  status:   z.enum(['active', 'closed', 'terminated']).optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createSessionSchema, listSessionsQuerySchema };
