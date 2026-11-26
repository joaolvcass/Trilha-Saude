'use strict';

const { pool, transaction } = require('../config/database');
const { str, fail } = require('../utils/helpers');
const { validateMoment, validId } = require('../utils/validators');
const { optionalProfessional } = require('../services/professional.service');
const { notification } = require('../services/notification.service');

const createAppointment = async (req, res) => {
  const v = req.body || {};
  const title = str(v.title), who = str(v.who), at = validateMoment(v.date);
  const location=str(v.location); const professionalId=await optionalProfessional(v.professionalId);
  if (!title || title.length > 60 || who.length > 60 || location.length > 150 || (v.professionalId && !professionalId) || !at) return fail(res, 400, 'Dados da consulta inválidos.');
  await transaction(async db => {
    await db.execute(
      'INSERT INTO appointments (user_id, title, who, appt_at, location, professional_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, who, at, location, professionalId]
    );
    await notification(db, req.user.id, 'Consulta agendada', title);
  });
  res.status(201).json({ ok: true });
};

const updateAppointment = async (req, res) => {
  if (!validId(req.params.id) || typeof req.body?.ok !== 'boolean') return fail(res, 400, 'Dados inválidos.');
  const [result] = await pool.execute(
    'UPDATE appointments SET confirmed = ? WHERE id = ? AND user_id = ?',
    [req.body.ok, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return fail(res, 404, 'Consulta não encontrada.');
  res.json({ ok: true });
};

const deleteAppointment = async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [result] = await pool.execute('DELETE FROM appointments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return fail(res, 404, 'Consulta não encontrada.');
  res.json({ ok: true });
};

module.exports = { createAppointment, updateAppointment, deleteAppointment };
