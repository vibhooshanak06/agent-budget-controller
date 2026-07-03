'use strict';

/**
 * session.controller.js
 *
 * Thin HTTP layer for Session lifecycle endpoints.
 */

const sessionService = require('../services/session.service');
const asyncHandler   = require('../utils/asyncHandler');

/** POST /api/v1/sessions */
const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.body);
  res.status(201).json({ status: 'success', data: session });
});

/** GET /api/v1/sessions */
const listSessions = asyncHandler(async (req, res) => {
  const result = await sessionService.listSessions(req.query);
  res.status(200).json({ status: 'success', ...result });
});

/** GET /api/v1/sessions/:id */
const getSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getSessionById(req.params.id);
  res.status(200).json({ status: 'success', data: session });
});

/** PATCH /api/v1/sessions/:id/close */
const closeSession = asyncHandler(async (req, res) => {
  const session = await sessionService.closeSession(req.params.id);
  res.status(200).json({ status: 'success', data: session });
});

module.exports = { createSession, listSessions, getSession, closeSession };
