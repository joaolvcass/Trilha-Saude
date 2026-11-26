'use strict';

const { pool, transaction } = require('../config/database');
const { validateName, validateEmail, validatePassword } = require('../utils/validators');
const { hashPassword, checkPassword } = require('../utils/password');
const { fail } = require('../utils/helpers');
const { notification } = require('../services/notification.service');
const { createSession, readToken, hashToken, clearSessionCookie } = require('../services/session.service');

const register = async (req, res) => {
  const v = req.body || {};
  const name = validateName(v.name), email = validateEmail(v.email);
  if (!name || !email || !validatePassword(v.password)) {
    return fail(res, 400, 'Informe nome, e-mail válido e senha de 8 a 128 caracteres.');
  }
  const pwd = await hashPassword(v.password);
  try {
    const userId = await transaction(async db => {
      const [result] = await db.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, pwd]
      );
      const id = result.insertId;
      await notification(db, id, 'Bem-vinda ao TrilhaSaúde', 'Cadastre suas consultas e exames para acompanhá-los aqui.');
      await db.execute(
        'INSERT INTO messages (user_id, is_mine, body) VALUES (?, 0, ?)',
        [id, 'Olá! Este é um chat demonstrativo, sem contato com uma equipe real.']
      );
      return id;
    });
    await createSession(pool, userId, res);
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return fail(res, 409, 'Este e-mail já tem cadastro. Entre com sua senha.');
    throw error;
  }
};

const login = async (req, res) => {
  const email = validateEmail(req.body?.email);
  const pwd = req.body?.password;
  if (!email || typeof pwd !== 'string') return fail(res, 400, 'E-mail ou senha incorretos.');
  const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows.length || !(await checkPassword(pwd, rows[0].password_hash))) {
    return fail(res, 401, 'E-mail ou senha incorretos.');
  }
  await createSession(pool, rows[0].id, res);
  res.json({ ok: true });
};

const logout = async (req, res) => {
  const token = readToken(req);
  if (token) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
  clearSessionCookie(res);
  res.json({ ok: true });
};

module.exports = { register, login, logout };
