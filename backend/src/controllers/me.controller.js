'use strict';

const { pool, transaction } = require('../config/database');
const { validateName, validateDay } = require('../utils/validators');
const { str, fail } = require('../utils/helpers');
const { notification } = require('../services/notification.service');
const { STEPS } = require('../constants/system.constants');
const { removeUpload } = require('../services/upload.service');
const { clearSessionCookie } = require('../services/session.service');

const getMe = async (req, res) => {
  const id = req.user.id;
  // Lembretes persistentes: a consulta usa UTC, assim como as datas salvas no banco.
  await transaction(async db => {
    const [upcoming] = await db.execute(
      `SELECT id, title, appt_at FROM appointments
       WHERE user_id = ? AND warned = 0
       AND appt_at > UTC_TIMESTAMP()
       AND appt_at <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)
       FOR UPDATE`, [id]
    );
    if (req.user.lemb) {
      for (const item of upcoming) {
        await db.execute('UPDATE appointments SET warned = 1 WHERE id = ? AND user_id = ?', [item.id, id]);
        await notification(db, id, 'Consulta nas próximas 24 horas', item.title);
      }
    }
  });

  const [[appts], [exams], [notes], [msgs], [results], [referrals], [documents], [professionals]] = await Promise.all([
    pool.execute(
      `SELECT id, title, who, professional_id, location, DATE_FORMAT(appt_at, '%Y-%m-%dT%H:%i:%sZ') AS date,
       confirmed AS ok, warned FROM appointments WHERE user_id = ? ORDER BY appt_at ASC`, [id]),
    pool.execute(
      `SELECT id, name, DATE_FORMAT(exam_date, '%Y-%m-%d') AS date, status
       FROM exams WHERE user_id = ? ORDER BY exam_date DESC, id DESC`, [id]),
    pool.execute(
      `SELECT id, title AS t, detail AS s, is_read AS r,
       UNIX_TIMESTAMP(created_at) * 1000 AS at
       FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30`, [id]),
    pool.execute(
      `SELECT id, is_mine AS me, body AS t FROM
         (SELECT id, is_mine, body FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT 300) AS recent
       ORDER BY id ASC`, [id]),
    pool.execute(`SELECT r.id, r.exam_id AS examId, r.description, r.original_name AS fileName,
       DATE_FORMAT(r.result_date,'%Y-%m-%d') AS date, (r.file_path IS NOT NULL) AS hasFile
       FROM results r JOIN exams e ON e.id=r.exam_id WHERE e.user_id=? ORDER BY r.result_date DESC,r.id DESC`,[id]),
    pool.execute(`SELECT id, destination, reason, status, professional_id AS professionalId,
       DATE_FORMAT(referral_date,'%Y-%m-%d') AS date FROM referrals WHERE user_id=? ORDER BY referral_date DESC,id DESC`,[id]),
    pool.execute(`SELECT id,name,original_name AS fileName,mime_type AS mimeType,
       DATE_FORMAT(uploaded_at,'%Y-%m-%d') AS date FROM documents WHERE user_id=? ORDER BY id DESC`,[id]),
    pool.execute('SELECT id,name,specialty,professional_registration AS registration FROM professionals ORDER BY name ASC')
  ]);
  res.json({
    email: req.user.email, name: req.user.name,
    data: {
      appts: appts.map(a => ({ ...a, ok: !!a.ok, warned: !!a.warned })),
      results: results.map(r=>({...r,hasFile:!!r.hasFile})), referrals, documents, professionals,
      exams,
      notes: notes.map(n => ({ ...n, r: !!n.r })),
      msgs: msgs.map(m => ({ ...m, me: !!m.me })),
      done: req.user.done, lemb: !!req.user.lemb, phone: req.user.phone, birthDate: req.user.birth_date, userType: req.user.user_type
    }
  });
};

const updateProfile = async (req, res) => {
  const name = validateName(req.body?.name);
  const phone = str(req.body?.phone);
  const rawBirthDate = req.body?.birthDate;
  const birthDate = rawBirthDate ? validateDay(rawBirthDate) : null;

  if (!name || phone.length > 20 || (rawBirthDate && !birthDate)) {
    return fail(res, 400, 'Nome, telefone ou data de nascimento inválidos.');
  }

  await transaction(async db => {
    await db.execute(
      'UPDATE users SET name = ?, phone = ?, birth_date = ? WHERE id = ?',
      [name, phone, birthDate, req.user.id]
    );
    await notification(db, req.user.id, 'Perfil atualizado', 'Seus dados foram salvos.');
  });
  res.json({ ok: true });
};

const updateReminders = async (req, res) => {
  if (typeof req.body?.lemb !== 'boolean') return fail(res, 400, 'Valor inválido.');
  await pool.execute('UPDATE users SET lemb = ? WHERE id = ?', [req.body.lemb, req.user.id]);
  res.json({ ok: true });
};

const updateProgress = async (req, res) => {
  const done = req.body?.done;
  if (!Number.isInteger(done) || done < 1 || done > 5 || Math.abs(done - req.user.done) !== 1) {
    return fail(res, 400, 'Etapa inválida.');
  }
  await transaction(async db => {
    const [result] = await db.execute(
      'UPDATE users SET done = ? WHERE id = ? AND done = ?',
      [done, req.user.id, req.user.done]
    );
    if (!result.affectedRows) {
      const error = new Error('Estado da jornada mudou; recarregue a página.');
      error.status = 409; throw error;
    }
    if (done > req.user.done) await notification(db, req.user.id, 'Etapa concluída', STEPS[req.user.done]);
  });
  res.json({ ok: true });
};

const deleteMe = async (req, res) => {
  const [files]=await pool.execute(`SELECT file_path AS fp FROM documents WHERE user_id=? UNION ALL
   SELECT r.file_path AS fp FROM results r JOIN exams e ON e.id=r.exam_id WHERE e.user_id=?`,[req.user.id,req.user.id]);
  await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
  await Promise.all(files.map(f=>removeUpload(f.fp)));
  clearSessionCookie(res);
  res.json({ ok: true });
};

module.exports = { getMe, updateProfile, updateReminders, updateProgress, deleteMe };
