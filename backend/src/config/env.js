'use strict';

/**
 * env.js — Centralised, Zod-validated environment configuration.
 * Fails fast at startup with clear messages if required vars are missing.
 */

const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  // Server
  NODE_ENV:    z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT:        z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default('v1'),

  // Database — accepts postgresql://, mysql:// or SQLite file: paths
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // OpenAI — must start with sk- but we only warn in dev if placeholder is set
  OPENAI_API_KEY:     z.string().min(1, 'OPENAI_API_KEY is required'),
  DEFAULT_MODEL:      z.string().default('gpt-4o-mini'),
  OPENAI_TIMEOUT_MS:  z.coerce.number().int().positive().default(30000),

  // Redis (optional — app works without it)
  REDIS_URL:         z.string().default('redis://localhost:6379'),
  REDIS_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  // Background Jobs
  CRON_RUNAWAY_DETECTION: z.string().default('0 * * * *'),
  CRON_DAILY_CLEANUP:     z.string().default('0 2 * * *'),
  CRON_MONTHLY_RESET:     z.string().default('0 0 1 * *'),
  RUNAWAY_THRESHOLD_PCT:  z.coerce.number().int().min(1).max(100).default(20),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS:    z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  parsed.error.errors.forEach((err) => {
    console.error(`   ${err.path.join('.')} — ${err.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

// Derived flags
env.isDevelopment = env.NODE_ENV === 'development';
env.isProduction  = env.NODE_ENV === 'production';
env.isTest        = env.NODE_ENV === 'test';

// Warn if OpenAI key is still a placeholder (development only)
if (env.isDevelopment && !env.OPENAI_API_KEY.startsWith('sk-') || env.OPENAI_API_KEY === 'sk-replace-with-your-real-openai-api-key') {
  console.warn('⚠️   OPENAI_API_KEY looks like a placeholder — /chat endpoints will fail until you set a real key.');
}

// Parse CORS origins into an array
env.corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

module.exports = env;
