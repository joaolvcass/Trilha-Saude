'use strict';

const express = require('express');
const path = require('node:path');
const { securityMiddleware } = require('./middleware/security.middleware');
const { requireAuth } = require('./middleware/auth.middleware');
const { errorMiddleware } = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use(securityMiddleware);

// Rotas públicas: cadastro, login e logout.
app.use('/api', require('./routes/auth.routes'));

// Todas as rotas seguintes de /api exigem autenticação.
app.use('/api', requireAuth);
app.use('/api', require('./routes/me.routes'));
app.use('/api', require('./routes/appointments.routes'));
app.use('/api', require('./routes/exams.routes'));
app.use('/api', require('./routes/notifications.routes'));
app.use('/api', require('./routes/messages.routes'));
app.use('/api', require('./routes/professionals.routes'));
app.use('/api', require('./routes/referrals.routes'));
app.use('/api', require('./routes/results.routes'));
app.use('/api', require('./routes/documents.routes'));

// Frontend e API continuam na mesma origem.
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));
app.use(errorMiddleware);

module.exports = app;
