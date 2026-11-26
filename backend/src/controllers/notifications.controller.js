'use strict';

const { pool } = require('../config/database');
const { validId } = require('../utils/validators');
const { fail } = require('../utils/helpers');

const readNotification = async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [result] = await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);
  if (!result.affectedRows) return fail(res, 404, 'Notificação não encontrada.');
  res.json({ ok: true });
};

const readAllNotifications = async (req, res) => {
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
};

const deleteNotifications = async (req, res) => {
  await pool.execute('DELETE FROM notifications WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
};

module.exports = { readNotification, readAllNotifications, deleteNotifications };
