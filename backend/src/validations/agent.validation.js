'use strict';

/**
 * agent.validation.js
 *
 * Zod schemas for all Agent endpoint request shapes.
 */

const { z } = require('zod');

// ── POST /agents ──────────────────────────────────────────────────────────────

const createAgentSchema = z.object({
  team_id:          z.string().uuid('team_id must be a valid UUID'),
  name:             z.string().min(1, 'Name is required').max(255).trim(),
  slug:             z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  budget_limit:     z
    .number({ invalid_type_error: 'budget_limit must be a number' })
    .nonnegative()
    .default(0),
  model_preference: z.string().max(100).nullable().optional(),
});

// ── PATCH /agents/:id ─────────────────────────────────────────────────────────

const updateAgentSchema = z.object({
  name:             z.string().min(1).max(255).trim().optional(),
  budget_limit:     z.number().nonnegative().optional(),
  model_preference: z.string().max(100).nullable().optional(),
  status:           z.enum(['active', 'suspended', 'blocked']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update.' },
);

// ── GET /agents (query params) ────────────────────────────────────────────────

const listAgentsQuerySchema = z.object({
  team_id: z.string().uuid().optional(),
  status:  z.enum(['active', 'suspended', 'blocked']).optional(),
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createAgentSchema, updateAgentSchema, listAgentsQuerySchema };
