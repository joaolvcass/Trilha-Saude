'use strict';

const express = require('express');
const { createReferral, updateReferral, deleteReferral } = require('../controllers/referrals.controller');

const router = express.Router();

router.post('/referrals', createReferral);
router.patch('/referrals/:id', updateReferral);
router.delete('/referrals/:id', deleteReferral);

module.exports = router;
