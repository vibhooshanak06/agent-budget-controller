'use strict';

/**
 * agent.routes.js
 *
 * GET    /api/v1/agents          — list agents (filterable by team_id)
 * POST   /api/v1/agents          — create agent
 * GET    /api/v1/agents/:id      — get agent by ID
 * PATCH  /api/v1/agents/:id      — update agent
 * DELETE /api/v1/agents/:id      — delete agent
 */

const { Router }      = require('express');
const agentController = require('../controllers/agent.controller');
const validate        = require('../middleware/validate');
const {
  createAgentSchema,
  updateAgentSchema,
  listAgentsQuerySchema,
} = require('../validations/agent.validation');

const router = Router();

router.get  ('/',    validate(listAgentsQuerySchema, 'query'), agentController.listAgents);
router.post ('/',    validate(createAgentSchema),              agentController.createAgent);
router.get  ('/:id',                                           agentController.getAgent);
router.patch('/:id', validate(updateAgentSchema),              agentController.updateAgent);
router.delete('/:id',                                          agentController.deleteAgent);
router.post('/:id/resume',                                     agentController.resumeAgent);

module.exports = router;
