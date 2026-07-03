'use strict';

/**
 * chat.routes.js
 *
 * POST /api/v1/chat
 *
 * Middleware chain (in order):
 *   1. validate(chatRequestSchema) — Zod body validation
 *   2. budgetGuard                 — pre-request budget enforcement
 *   3. chatController.chat         — OpenAI call + usage logging
 */

const { Router }       = require('express');
const chatController   = require('../controllers/chat.controller');
const validate         = require('../middleware/validate');
const budgetGuard      = require('../middleware/budgetGuard');
const { chatRequestSchema } = require('../validations/chat.validation');

const router = Router();

router.post(
  '/',
  validate(chatRequestSchema),  // 1. Validate shape + model name
  budgetGuard,                   // 2. Enforce budget (throws 403 if exhausted)
  chatController.chat,           // 3. Call OpenAI and log usage
);

module.exports = router;
