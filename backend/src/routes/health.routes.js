'use strict';

const { Router } = require('express');
const { getHealth, getDbHealth, getRedisHealth, getOpenAIHealth } = require('../controllers/health.controller');

const router = Router();

router.get('/',       getHealth);
router.get('/database', getDbHealth);
router.get('/redis',  getRedisHealth);
router.get('/openai', getOpenAIHealth);

module.exports = router;
