'use strict';

/**
 * team.validation.js
 *
 * Zod schemas for all Team endpoint request shapes.
 */

const { z } = require('zod');

// ── Shared field definitions ──────────────────────────────────────────────────

const teamSlug = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(100, 'Slug must be at most 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens');

const budgetAmount = z
  .number({ invalid_type_error: 'Budget must be a number' })
  .nonnegative('Budget must be zero or greater')
  .multipleOf(0.000001, 'Budget supports up to 6 decimal places');

// ── POST /teams ───────────────────────────────────────────────────────────────

const createTeamSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(255).trim(),
  slug:         teamSlug,
  budget_limit: budgetAmount.default(0),
});

// ── PATCH /teams/:id ──────────────────────────────────────────────────────────

const updateTeamSchema = z.object({
  name:         z.string().min(1).max(255).trim().optional(),
  budget_limit: budgetAmount.optional(),
  status:       z.enum(['active', 'suspended']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update.' },
);

// ── GET /teams (query params) ─────────────────────────────────────────────────

const listTeamsQuerySchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createTeamSchema, updateTeamSchema, listTeamsQuerySchema };
