'use strict';

/**
 * chat.controller.js
 *
 * Thin HTTP layer for the POST /chat inference endpoint.
 */

const chatService = require('../services/chat.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/chat
 */
const chat = asyncHandler(async (req, res) => {
  const result = await chatService.processChat(req.body);
  res.status(200).json({ status: 'success', data: result });
});

module.exports = { chat };
