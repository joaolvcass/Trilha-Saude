'use strict';

const express = require('express');
const { createExam, updateExam, deleteExam } = require('../controllers/exams.controller');

const router = express.Router();

router.post('/exams', createExam);
router.patch('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

module.exports = router;
