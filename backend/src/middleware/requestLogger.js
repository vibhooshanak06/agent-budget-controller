'use strict';

/**
 * requestLogger.js
 *
 * Pino HTTP middleware that logs every incoming request and outgoing
 * response with structured fields: method, url, status, responseTime.
 * In development the auto-logging serialiser is set to 'short' for
 * readability; in production full serialisation is used.
 */

const pinoHttp = require('pino-http');
const logger = require('../config/logger');

const requestLogger = pinoHttp({
  logger,
  // Auto-log at 'info' for successful responses, 'warn' for 4xx, 'error' for 5xx
  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Attach a request-scoped logger available as req.log inside handlers
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

module.exports = requestLogger;
