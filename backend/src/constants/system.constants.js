'use strict';

const path = require('node:path');

const COOKIE = 'trilhosaude_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const STORAGE = path.join(__dirname, '..', '..', 'private_uploads');
const ALLOWED_MIMES = {'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png'};
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const STATUSES = ['Agendado', 'Coletado', 'Em análise', 'Resultado disponível'];
const STEPS = ['Cadastro', 'Consulta inicial', 'Coleta do exame', 'Análise do resultado', 'Retorno com a equipe'];

module.exports = { COOKIE, SESSION_SECONDS, STORAGE, ALLOWED_MIMES, MAX_FILE_BYTES, STATUSES, STEPS };
