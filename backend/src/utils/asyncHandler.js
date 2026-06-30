'use strict';

/**
 * asyncHandler.js
 *
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to Express's next(err) error pipeline.
 *
 * Without this wrapper every async controller would need its own
 * try/catch block. With it, you just write:
 *
 *   router.get('/resource', asyncHandler(myController));
 *
 * @param {Function} fn - Async Express handler (req, res, next)
 * @returns {Function}  - Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
