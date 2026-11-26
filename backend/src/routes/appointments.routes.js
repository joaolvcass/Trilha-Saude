'use strict';

const express = require('express');
const { createAppointment, updateAppointment, deleteAppointment } = require('../controllers/appointments.controller');

const router = express.Router();

router.post('/appointments', createAppointment);
router.patch('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);

module.exports = router;
