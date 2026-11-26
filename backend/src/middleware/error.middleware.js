'use strict';

const { fail } = require('../utils/helpers');

function errorMiddleware(err, req, res, next) {
  console.error('Erro do servidor:', err);
  if (err.status) return fail(res, err.status, err.message);
  if (err.type === 'entity.too.large') return fail(res, 413, 'Requisição muito grande.');
  if (err instanceof SyntaxError && 'body' in err) return fail(res, 400, 'JSON inválido.');
  return fail(res, 500, 'Falha interna. Verifique o terminal do servidor.');
}

module.exports = { errorMiddleware };
