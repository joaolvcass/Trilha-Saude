'use strict';

const express = require('express');
const { createProfessional } = require('../controllers/professionals.controller');

const router = express.Router();

router.post('/professionals', createProfessional);

module.exports = router;
