'use strict';

/**
 * agent.controller.js
 *
 * Thin HTTP layer for Agent endpoints.
 */

const agentService = require('../services/agent.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/agents
 */
const createAgent = asyncHandler(async (req, res) => {
  const agent = await agentService.createAgent(req.body);
  res.status(201).json({ status: 'success', data: agent });
});

/**
 * GET /api/v1/agents
 */
const listAgents = asyncHandler(async (req, res) => {
  const result = await agentService.listAgents(req.query);
  res.status(200).json({ status: 'success', ...result });
});

/**
 * GET /api/v1/agents/:id
 */
const getAgent = asyncHandler(async (req, res) => {
  const agent = await agentService.getAgentById(req.params.id);
  res.status(200).json({ status: 'success', data: agent });
});

module.exports = { createAgent, listAgents, getAgent };
