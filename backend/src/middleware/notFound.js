'use strict';

/**
 * notFound.js
 *
 * 404 handler — catches any request that didn't match a registered route
 * and forwards a structured AppError to the centralised error handler.
 * Must be mounted AFTER all route definitions in app.js.
 */

const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      'ROUTE_NOT_FOUND',
    ),
  );
};

module.exports = notFound;
