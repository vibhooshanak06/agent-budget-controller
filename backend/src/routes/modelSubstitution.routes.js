'use strict';

const { Router } = require('express');
const { listSubstitutions } = require('../controllers/modelSubstitution.controller');

const router = Router();

router.get('/', listSubstitutions);

module.exports = router;
