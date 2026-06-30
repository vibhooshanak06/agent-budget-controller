'use strict';

const { Router } = require('express');
const agentController = require('../controllers/agent.controller');
const validate = require('../middleware/validate');
const { createAgentSchema, listAgentsQuerySchema } = require('../validations/agent.validation');

const router = Router();

router.post('/', validate(createAgentSchema), agentController.createAgent);
router.get('/', validate(listAgentsQuerySchema, 'query'), agentController.listAgents);
router.get('/:id', agentController.getAgent);

module.exports = router;
