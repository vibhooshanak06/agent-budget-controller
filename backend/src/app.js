'use strict';

/**
 * app.js
 *
 * Express application factory.
 * This module creates and configures the Express app but does NOT call
 * app.listen() — that responsibility belongs to server.js.
 * Separating them makes the app importable by tests without binding a port.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

// ── Create Express app ────────────────────────────────────────────────────────
const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// Helmet sets sensible HTTP security headers (XSS protection, HSTS, etc.)
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Response compression ──────────────────────────────────────────────────────
app.use(compression());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging ───────────────────────────────────────────────────────────
// Morgan provides a concise dev-mode console log; Pino handles structured logs
if (env.isDevelopment) {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// ── Trust proxy (required behind nginx / ELB / cloud load balancers) ──────────
app.set('trust proxy', 1);

// ── API routes ────────────────────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, routes);

// ── 404 handler ───────────────────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(notFound);

// ── Centralised error handler ─────────────────────────────────────────────────
// Must be the LAST middleware (four-argument signature required by Express)
app.use(errorHandler);

logger.info({ apiVersion: env.API_VERSION, env: env.NODE_ENV }, 'Express app initialised');

module.exports = app;
