'use strict';

/**
 * AppError.js
 *
 * Custom application error class.
 * Extends the native Error so stack traces are preserved.
 * The `isOperational` flag distinguishes expected business errors
 * (e.g. 404 Not Found, 400 Validation) from unexpected programmer
 * errors (e.g. null dereferences). Only operational errors get a
 * user-facing JSON response; others trigger a generic 500.
 */

class AppError extends Error {
  /**
   * @param {string}  message        - Human-readable error description
   * @param {number}  statusCode     - HTTP status code to return
   * @param {string}  [code]         - Optional machine-readable error code
   * @param {object}  [details]      - Optional extra detail (e.g. validation errors)
   */
  constructor(message, statusCode, code = null, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.code = code;
    this.details = details;
    this.isOperational = true;

    // Capture a clean stack trace that excludes this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
