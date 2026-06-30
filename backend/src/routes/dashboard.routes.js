'use strict';

const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = Router();

router.get('/', dashboardController.getDashboard);

module.exports = router;
