'use strict';

/**
 * chat.validation.js
 *
 * Zod schema for the POST /chat inference endpoint.
 *
 * Model is optional at the API level — the service resolves precedence:
 *   1. model from request body (if provided)
 *   2. agent.modelPreference   (if set)
 *   3. DEFAULT_MODEL env var   (fallback)
 */

const { z } = require('zod');

// Supported model identifiers — kept here as a reference for clients.
// The service validates the resolved model against OpenAI; an unsupported
// model will produce a clear OpenAI API error rather than a silent fallback.
const SUPPORTED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
];

// ── POST /chat ────────────────────────────────────────────────────────────────

const chatRequestSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
  agent_id:   z.string().uuid('agent_id must be a valid UUID'),

  // Model is optional — omit to use agent preference or DEFAULT_MODEL
  model: z
    .string()
    .max(100, 'model name is too long')
    .optional()
    .nullable(),

  prompt: z
    .string()
    .min(1, 'prompt is required')
    .max(128_000, 'prompt exceeds maximum length of 128,000 characters'),
});

module.exports = { chatRequestSchema, SUPPORTED_MODELS };
