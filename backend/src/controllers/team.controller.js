'use strict';

/**
 * team.controller.js
 *
 * Thin HTTP layer for Team endpoints.
 * Controllers only: parse request → call service → send response.
 */

const teamService = require('../services/team.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/teams
 */
const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  res.status(201).json({ status: 'success', data: team });
});

/**
 * GET /api/v1/teams
 */
const listTeams = asyncHandler(async (req, res) => {
  const result = await teamService.listTeams(req.query);
  res.status(200).json({ status: 'success', ...result });
});

/**
 * GET /api/v1/teams/:id
 */
const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  res.status(200).json({ status: 'success', data: team });
});

module.exports = { createTeam, listTeams, getTeam };
