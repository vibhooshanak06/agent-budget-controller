'use strict';

/**
 * chat.validation.js
 *
 * Zod schemas for the POST /chat inference endpoint.
 */

const { z } = require('zod');

// Supported model identifiers (extend this list as new models are added)
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
  agent_id: z.string().uuid('agent_id must be a valid UUID'),
  model: z
    .string()
    .min(1, 'model is required')
    .refine((m) => SUPPORTED_MODELS.includes(m), {
      message: `model must be one of: ${SUPPORTED_MODELS.join(', ')}`,
    }),
  prompt: z
    .string()
    .min(1, 'prompt is required')
    .max(128_000, 'prompt exceeds maximum length of 128,000 characters'),
});

module.exports = { chatRequestSchema, SUPPORTED_MODELS };
