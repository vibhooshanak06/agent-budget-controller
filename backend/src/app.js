'use strict';

/**
 * app.js — Express application factory (no listen).
 */

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');

const env            = require('./config/env');
const logger         = require('./config/logger');
const requestId      = require('./middleware/requestId');
const requestLogger  = require('./middleware/requestLogger');
const rateLimiter    = require('./middleware/rateLimiter');
const notFound       = require('./middleware/notFound');
const errorHandler   = require('./middleware/errorHandler');
const routes         = require('./routes/index');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:       env.corsOrigins,
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials:  true,
}));

// ── Request ID (tracing) ──────────────────────────────────────────────────────
app.use(requestId);

// ── Compression + parsing ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
if (env.isDevelopment) app.use(morgan('dev'));
app.use(requestLogger);

app.set('trust proxy', 1);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, routes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

logger.info({ apiVersion: env.API_VERSION, env: env.NODE_ENV }, 'Express app initialised');

module.exports = app;
