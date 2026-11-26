'use strict';

const express = require('express');
const { readNotification, readAllNotifications, deleteNotifications } = require('../controllers/notifications.controller');

const router = express.Router();

router.patch('/notifications/:id/read', readNotification);
router.post('/notifications/read-all', readAllNotifications);
router.delete('/notifications', deleteNotifications);

module.exports = router;
