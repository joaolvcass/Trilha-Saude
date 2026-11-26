'use strict';

const express = require('express');
const { createMessage } = require('../controllers/messages.controller');

const router = express.Router();

router.post('/messages', createMessage);

module.exports = router;
