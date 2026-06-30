'use strict';

/**
 * db.js
 *
 * Prisma client singleton.
 * Exporting a single instance prevents connection pool exhaustion
 * under hot-reload in development (nodemon re-requires modules each
 * time, so without this guard you'd open a new pool on every file save).
 */

const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('./logger');

// In development, attach query event logging so slow/unexpected SQL is visible
const prismaOptions =
  env.isDevelopment
    ? {
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
      }
    : {};

// Singleton pattern — reuse the same client across hot reloads
const globalForPrisma = global;
const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (env.isDevelopment) {
  globalForPrisma.prisma = prisma;

  // Log slow or unexpected queries in development
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma query');
  });

  prisma.$on('warn', (e) => {
    logger.warn({ message: e.message }, 'Prisma warning');
  });

  prisma.$on('error', (e) => {
    logger.error({ message: e.message }, 'Prisma error');
  });
}

/**
 * Verify the database connection is reachable.
 * Called once at server startup.
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅  Database connection established');
  } catch (error) {
    logger.error({ err: error }, '❌  Failed to connect to database');
    throw error;
  }
}

/**
 * Gracefully close the Prisma connection pool.
 * Called on process shutdown signals.
 */
async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
