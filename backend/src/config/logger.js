'use strict';

/**
 * logger.js
 *
 * Singleton Pino logger instance used throughout the application.
 * In development, output is pretty-printed for readability.
 * In production, output is newline-delimited JSON (NDJSON) for log aggregators.
 */

const pino = require('pino');
const env = require('./env');

const transport =
  env.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined; // default NDJSON in production

const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields from all log output
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
      censor: '[REDACTED]',
    },
  },
  transport ? pino.transport(transport) : undefined,
);

module.exports = logger;
