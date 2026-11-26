'use strict';

const express = require('express');
const { createDocument, getDocumentFile, deleteDocument } = require('../controllers/documents.controller');

const router = express.Router();

router.post('/documents', createDocument);
router.get('/documents/:id/file', getDocumentFile);
router.delete('/documents/:id', deleteDocument);

module.exports = router;
