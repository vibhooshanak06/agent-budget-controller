'use strict';

/**
 * routes/index.js — Root router mounting all sub-routers.
 */

const { Router } = require('express');

const healthRoutes              = require('./health.routes');
const teamRoutes                = require('./team.routes');
const agentRoutes               = require('./agent.routes');
const sessionRoutes             = require('./session.routes');
const chatRoutes                = require('./chat.routes');
const dashboardRoutes           = require('./dashboard.routes');
const alertRoutes               = require('./alert.routes');
const usageLogRoutes            = require('./usageLog.routes');
const modelSubstitutionRoutes   = require('./modelSubstitution.routes');

const router = Router();

router.use('/health',              healthRoutes);
router.use('/teams',               teamRoutes);
router.use('/agents',              agentRoutes);
router.use('/sessions',            sessionRoutes);
router.use('/chat',                chatRoutes);
router.use('/dashboard',           dashboardRoutes);
router.use('/alerts',              alertRoutes);
router.use('/usage-logs',          usageLogRoutes);
router.use('/model-substitutions', modelSubstitutionRoutes);

module.exports = router;
