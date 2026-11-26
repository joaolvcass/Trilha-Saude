'use strict';

const { pool, transaction } = require('../config/database');
const { str, fail } = require('../utils/helpers');
const { validateDay, validId } = require('../utils/validators');
const { STATUSES } = require('../constants/system.constants');
const { notification } = require('../services/notification.service');
const { removeUpload } = require('../services/upload.service');

const createExam = async (req, res) => {
  const v = req.body || {};
  const name = str(v.name), date = validateDay(v.date);
  if (!name || name.length > 60 || !date || !STATUSES.includes(v.status)) return fail(res, 400, 'Dados do exame inválidos.');
  await transaction(async db => {
    await db.execute('INSERT INTO exams (user_id, name, exam_date, status) VALUES (?, ?, ?, ?)',
      [req.user.id, name, date, v.status]);
    await notification(db, req.user.id, 'Exame cadastrado', `${name} · ${v.status}`);
  });
  res.status(201).json({ ok: true });
};

const updateExam = async (req, res) => {
  if (!validId(req.params.id) || !STATUSES.includes(req.body?.status)) return fail(res, 400, 'Situação inválida.');
  const updated = await transaction(async db => {
    const [rows] = await db.execute('SELECT name FROM exams WHERE id = ? AND user_id = ? FOR UPDATE', [req.params.id, req.user.id]);
    if (!rows.length) return false;
    await db.execute('UPDATE exams SET status = ? WHERE id = ? AND user_id = ?', [req.body.status, req.params.id, req.user.id]);
    await notification(db, req.user.id, 'Exame atualizado', `${rows[0].name} · ${req.body.status}`);
    return true;
  });
  if (!updated) return fail(res, 404, 'Exame não encontrado.');
  res.json({ ok: true });
};

const deleteExam = async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [files]=await pool.execute('SELECT r.file_path AS fp FROM results r JOIN exams e ON e.id=r.exam_id WHERE e.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  const [result] = await pool.execute('DELETE FROM exams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if(result.affectedRows)await Promise.all(files.map(f=>removeUpload(f.fp)));
  if (!result.affectedRows) return fail(res, 404, 'Exame não encontrado.');
  res.json({ ok: true });
};

module.exports = { createExam, updateExam, deleteExam };
