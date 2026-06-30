'use strict';

const { Router } = require('express');
const teamController = require('../controllers/team.controller');
const validate = require('../middleware/validate');
const { createTeamSchema, listTeamsQuerySchema } = require('../validations/team.validation');

const router = Router();

router.post('/', validate(createTeamSchema), teamController.createTeam);
router.get('/', validate(listTeamsQuerySchema, 'query'), teamController.listTeams);
router.get('/:id', teamController.getTeam);

module.exports = router;
