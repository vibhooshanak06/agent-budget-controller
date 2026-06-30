'use strict';

const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const validate = require('../middleware/validate');
const { chatRequestSchema } = require('../validations/chat.validation');

const router = Router();

router.post('/', validate(chatRequestSchema), chatController.chat);

module.exports = router;
