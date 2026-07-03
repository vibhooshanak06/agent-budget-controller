'use strict';

/**
 * session.routes.js
 *
 * POST  /api/v1/sessions             — open a new session
 * GET   /api/v1/sessions             — list sessions (filterable by agent_id)
 * GET   /api/v1/sessions/:id         — get session by ID
 * PATCH /api/v1/sessions/:id/close   — manually close a session
 */

const { Router }        = require('express');
const sessionController = require('../controllers/session.controller');
const validate          = require('../middleware/validate');
const {
  createSessionSchema,
  listSessionsQuerySchema,
} = require('../validations/session.validation');

const router = Router();

router.post ('/',              validate(createSessionSchema),          sessionController.createSession);
router.get  ('/',              validate(listSessionsQuerySchema, 'query'), sessionController.listSessions);
router.get  ('/:id',                                                   sessionController.getSession);
router.patch('/:id/close',                                             sessionController.closeSession);

module.exports = router;
