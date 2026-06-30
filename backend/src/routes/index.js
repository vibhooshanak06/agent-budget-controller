'use strict';

/**
 * routes/index.js
 *
 * Root router. Mounts all resource sub-routers under /api/v1.
 * Adding a new resource requires only a single line here.
 */

const { Router } = require('express');

const healthRoutes = require('./health.routes');
const teamRoutes = require('./team.routes');
const agentRoutes = require('./agent.routes');
const sessionRoutes = require('./session.routes');
const chatRoutes = require('./chat.routes');
const dashboardRoutes = require('./dashboard.routes');
const alertRoutes = require('./alert.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/teams', teamRoutes);
router.use('/agents', agentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);

module.exports = router;
