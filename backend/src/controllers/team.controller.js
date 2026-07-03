'use strict';

/**
 * team.controller.js
 *
 * Thin HTTP layer for Team CRUD endpoints.
 * Controllers only: parse req → call service → send res.
 */

const teamService  = require('../services/team.service');
const asyncHandler = require('../utils/asyncHandler');

/** POST /api/v1/teams */
const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  res.status(201).json({ status: 'success', data: team });
});

/** GET /api/v1/teams */
const listTeams = asyncHandler(async (req, res) => {
  const result = await teamService.listTeams(req.query);
  res.status(200).json({ status: 'success', ...result });
});

/** GET /api/v1/teams/:id */
const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  res.status(200).json({ status: 'success', data: team });
});

/** PATCH /api/v1/teams/:id */
const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: team });
});

/** DELETE /api/v1/teams/:id */
const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.id);
  res.status(204).send();
});

module.exports = { createTeam, listTeams, getTeam, updateTeam, deleteTeam };
