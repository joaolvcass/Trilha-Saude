'use strict';

const express = require('express');
const { createResult, deleteResult, getResultFile } = require('../controllers/results.controller');

const router = express.Router();

router.post('/results', createResult);
router.delete('/results/:id', deleteResult);
router.get('/results/:id/file', getResultFile);

module.exports = router;
