'use strict';

/**
 * errorHandler.js
 *
 * Centralised Express error-handling middleware.
 * Must be the LAST middleware registered in app.js (four-parameter signature).
 *
 * Handles:
 *   - AppError instances         → operational errors with a specific status code
 *   - Prisma known request errors → maps DB constraint violations to 4xx responses
 *   - Zod errors (if unwrapped)  → returns 400 with field-level details
 *   - Everything else            → returns 500 and logs the full error
 *
 * In production, internal stack traces are never sent to the client.
 */

const { Prisma } = require('@prisma/client');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const env = require('../config/env');

// ── Prisma error → AppError mapping ──────────────────────────────────────────

function handlePrismaError(err) {
  // Unique constraint violation (e.g. duplicate slug)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.join(', ') ?? 'field';
      return new AppError(
        `A record with this ${field} already exists.`,
        409,
        'CONFLICT',
      );
    }

    // Record not found (findUniqueOrThrow / updateOrThrow)
    if (err.code === 'P2025') {
      return new AppError('Record not found.', 404, 'NOT_FOUND');
    }

    // Foreign key constraint failure
    if (err.code === 'P2003') {
      return new AppError(
        'Related record not found.',
        400,
        'FOREIGN_KEY_CONSTRAINT',
      );
    }
  }

  // Validation error from Prisma (malformed data types)
  if (err instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid data provided.', 400, 'DB_VALIDATION_ERROR');
  }

  return null; // not a Prisma error we recognise
}

// ── Main error handler ────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Try to convert Prisma errors into operational AppErrors
  const prismaError = handlePrismaError(err);
  const error = prismaError ?? err;

  // Log the error with appropriate level
  if (error.isOperational && error.statusCode < 500) {
    req.log?.warn({ err: error }, error.message);
  } else {
    logger.error({ err: error, reqId: req.id }, error.message ?? 'Unhandled error');
  }

  // Operational error — send specific response
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      code: error.code ?? null,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Unknown / programmer error — never leak internal details to the client
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    // Include stack in development only to aid debugging
    ...(env.isDevelopment ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
