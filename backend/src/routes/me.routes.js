'use strict';

const express = require('express');
const { getMe, updateProfile, updateReminders, updateProgress, deleteMe } = require('../controllers/me.controller');

const router = express.Router();

router.get('/me', getMe);
router.patch('/me/profile', updateProfile);
router.patch('/me/reminders', updateReminders);
router.patch('/me/progress', updateProgress);
router.delete('/me', deleteMe);

module.exports = router;
