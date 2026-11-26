'use strict';

const { pool } = require('../config/database');
const { readToken, hashToken } = require('../services/session.service');
const { fail } = require('../utils/helpers');

async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return fail(res, 401, 'Faça login para continuar.');
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.name, u.phone, u.birth_date, u.user_type, u.done, u.lemb
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1`,
      [hashToken(token)]
    );
    if (!rows.length) return fail(res, 401, 'Sessão expirada. Entre novamente.');
    req.user = rows[0];
    req.sessionToken = token;
    next();
  } catch (error) { next(error); }
}

module.exports = { requireAuth };
