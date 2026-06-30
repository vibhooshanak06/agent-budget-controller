'use strict';

const { Router } = require('express');
const sessionController = require('../controllers/session.controller');
const validate = require('../middleware/validate');
const { createSessionSchema } = require('../validations/session.validation');

const router = Router();

router.post('/', validate(createSessionSchema), sessionController.createSession);
router.get('/:id', sessionController.getSession);

module.exports = router;
