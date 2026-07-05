'use strict';

/**
 * server.js — HTTP + Socket.IO server bootstrap.
 */

const http = require('http');
const app  = require('./app');
const env  = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { connectRedis, disconnectRedis }       = require('./config/redis');
const { initIO }                              = require('./config/socket');
const { startScheduler, stopScheduler }       = require('./jobs/scheduler');

const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
initIO(server);

async function start() {
  try {
    await connectDatabase();
    await connectRedis();        // non-fatal if unavailable
    startScheduler();

    server.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV, api: `/api/${env.API_VERSION}` },
        `🚀  Agent Budget Controller v2 running on port ${env.PORT}`,
      );
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received');
  stopScheduler();
  server.close(async () => {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

start();
