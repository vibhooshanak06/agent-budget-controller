'use strict';

/**
 * team.routes.js
 *
 * GET    /api/v1/teams          — list teams
 * POST   /api/v1/teams          — create team
 * GET    /api/v1/teams/:id      — get team by ID
 * PATCH  /api/v1/teams/:id      — update team
 * DELETE /api/v1/teams/:id      — delete team
 */

const { Router }     = require('express');
const teamController = require('../controllers/team.controller');
const validate       = require('../middleware/validate');
const {
  createTeamSchema,
  updateTeamSchema,
  listTeamsQuerySchema,
} = require('../validations/team.validation');

const router = Router();

router.get  ('/',    validate(listTeamsQuerySchema, 'query'), teamController.listTeams);
router.post ('/',    validate(createTeamSchema),              teamController.createTeam);
router.get  ('/:id',                                          teamController.getTeam);
router.patch('/:id', validate(updateTeamSchema),              teamController.updateTeam);
router.delete('/:id',                                         teamController.deleteTeam);

module.exports = router;
