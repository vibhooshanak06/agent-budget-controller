'use strict';

const { Router } = require('express');
const { listUsageLogs } = require('../controllers/usageLog.controller');

const router = Router();

router.get('/', listUsageLogs);

module.exports = router;
