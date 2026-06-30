'use strict';

/**
 * server.js
 *
 * HTTP server bootstrap.
 * Responsibilities:
 *   1. Load environment configuration (via app.js → config/env.js)
 *   2. Verify the database connection
 *   3. Start the HTTP server
 *   4. Register graceful shutdown handlers for SIGTERM / SIGINT
 *
 * This file should NOT be imported by tests — use app.js directly.
 */

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/db');

// ── Create HTTP server ────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify DB is reachable before accepting traffic
    await connectDatabase();

    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          api: `/api/${env.API_VERSION}`,
        },
        `🚀  Agent Budget Controller running on port ${env.PORT}`,
      );
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Allows in-flight requests to complete before the process exits.
// Container orchestrators (ECS, K8s) send SIGTERM before forcibly killing.

async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received — draining connections');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDatabase();
    } catch (err) {
      logger.error({ err }, 'Error during database disconnect');
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit after 30 seconds if connections don't drain
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejection safety net ───────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection — shutting down');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception — shutting down');
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
start();
