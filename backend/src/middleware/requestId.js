'use strict';

/**
 * requestId.js
 *
 * Assigns a unique UUID to every request as req.id and X-Request-ID header.
 * Used for distributed tracing and log correlation.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};
