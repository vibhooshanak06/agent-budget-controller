'use strict';

const { Router } = require('express');
const alertController = require('../controllers/alert.controller');

const router = Router();

router.get('/', alertController.listAlerts);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);

module.exports = router;
