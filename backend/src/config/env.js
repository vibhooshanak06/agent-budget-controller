'use strict';

/**
 * env.js
 *
 * Centralised environment configuration.
 * Validates all required env vars at startup using Zod so the server
 * fails fast with a clear message rather than crashing at runtime.
 */

const { z } = require('zod');

// Load .env before validation
require('dotenv').config();

// ── Schema ────────────────────────────────────────────────────────────────────
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid connection string')
    .min(1),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // OpenAI
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OPENAI_API_KEY is required')
    .startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
  DEFAULT_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

// ── Parse & validate ──────────────────────────────────────────────────────────
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  parsed.error.errors.forEach((err) => {
    console.error(`   ${err.path.join('.')} — ${err.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

// Derive helper flags
env.isDevelopment = env.NODE_ENV === 'development';
env.isProduction = env.NODE_ENV === 'production';
env.isTest = env.NODE_ENV === 'test';

// Parse CORS_ORIGINS into an array
env.corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

module.exports = env;
