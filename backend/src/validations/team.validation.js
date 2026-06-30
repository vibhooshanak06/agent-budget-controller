'use strict';

/**
 * team.validation.js
 *
 * Zod schemas for Team resource endpoints.
 * Schemas are exported individually so each route can pick exactly
 * what it needs to validate (body, query, params).
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
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters').trim(),
  slug: teamSlug,
  budget_limit: budgetAmount.default(0),
});

// ── GET /teams (query params) ─────────────────────────────────────────────────

const listTeamsQuerySchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── PATCH /teams/:id (future) ─────────────────────────────────────────────────

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  budget_limit: budgetAmount.optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

module.exports = { createTeamSchema, listTeamsQuerySchema, updateTeamSchema };
