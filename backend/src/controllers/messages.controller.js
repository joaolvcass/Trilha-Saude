'use strict';

const { transaction } = require('../config/database');
const { str, fail } = require('../utils/helpers');

const createMessage = async (req, res) => {
  const body = str(req.body?.text);
  if (!body || body.length > 500) return fail(res, 400, 'Mensagem vazia ou maior que 500 caracteres.');
  await transaction(async db => {
    await db.execute('INSERT INTO messages (user_id, is_mine, body) VALUES (?, 1, ?)', [req.user.id, body]);
    await db.execute('INSERT INTO messages (user_id, is_mine, body) VALUES (?, 0, ?)',
      [req.user.id, 'Resposta automática de demonstração: sua mensagem foi registrada somente neste protótipo.']);
  });
  res.status(201).json({ ok: true });
};

module.exports = { createMessage };
