'use strict';

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
const { promisify } = require('node:util');
const { rateLimit } = require('express-rate-limit');

const scrypt = promisify(crypto.scrypt);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const COOKIE = 'trilhosaude_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const STORAGE = path.join(__dirname, 'private_uploads');
const ALLOWED_MIMES = {'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png'};
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const STATUSES = ['Agendado', 'Coletado', 'Em análise', 'Resultado disponível'];
const STEPS = ['Cadastro', 'Consulta inicial', 'Coleta do exame', 'Análise do resultado', 'Retorno com a equipe'];

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trilhosaude',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true
});

app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', req.path.startsWith('/api/') ? 'no-store' : 'no-cache');
  // Proteção adicional de CSRF: a interface e a API rodam na mesma origem.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: 'Origem não permitida.' });
    }
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          return res.status(403).json({ error: 'Origem não permitida.' });
        }
      } catch {
        return res.status(403).json({ error: 'Origem não permitida.' });
      }
    }
  }
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' }
});

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const str = value => typeof value === 'string' ? value.trim() : '';
function fail(res, status, error) { return res.status(status).json({ error }); }

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, Buffer.from(salt, 'hex'), 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function checkPassword(password, stored) {
  const [alg, salt, expected] = String(stored).split(':');
  if (alg !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
function validateName(value) {
  const name = str(value);
  return name.length >= 2 && name.length <= 60 ? name : null;
}
function validateEmail(value) {
  const email = str(value).toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}
function validateDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value ? value : null;
}
function validateMoment(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(+date) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
function validId(value) { return /^[1-9]\d*$/.test(String(value)) ? value : null; }

function setSessionCookie(res, token) {
  const options = [
    `${COOKIE}=${token}`, 'HttpOnly', 'Path=/', 'SameSite=Strict',
    `Max-Age=${SESSION_SECONDS}`
  ];
  if (process.env.NODE_ENV === 'production') options.push('Secure');
  res.setHeader('Set-Cookie', options.join('; '));
}
function clearSessionCookie(res) {
  const options = [`${COOKIE}=`, 'HttpOnly', 'Path=/', 'SameSite=Strict', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') options.push('Secure');
  res.setHeader('Set-Cookie', options.join('; '));
}
function readToken(req) {
  const item = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  const token = item && item.slice(COOKIE.length + 1);
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
}
async function createSession(db, userId, res) {
  // Remova periodicamente sessões vencidas para a tabela não crescer sem limite.
  await db.execute('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()');
  const token = crypto.randomBytes(32).toString('hex');
  await db.execute(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))',
    [hashToken(token), userId]
  );
  setSessionCookie(res, token);
}
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
async function transaction(fn) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const output = await fn(db);
    await db.commit();
    return output;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally { db.release(); }
}
async function notification(db, userId, title, detail) {
  await db.execute('INSERT INTO notifications (user_id, title, detail) VALUES (?, ?, ?)', [userId, title, detail]);
}

// ---------- Cadastro, login e sessão ----------
app.post('/api/register', authLimiter, async (req, res) => {
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
});
app.post('/api/login', authLimiter, async (req, res) => {
  const email = validateEmail(req.body?.email);
  const pwd = req.body?.password;
  if (!email || typeof pwd !== 'string') return fail(res, 400, 'E-mail ou senha incorretos.');
  const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows.length || !(await checkPassword(pwd, rows[0].password_hash))) {
    return fail(res, 401, 'E-mail ou senha incorretos.');
  }
  await createSession(pool, rows[0].id, res);
  res.json({ ok: true });
});
app.post('/api/logout', async (req, res) => {
  const token = readToken(req);
  if (token) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
  clearSessionCookie(res);
  res.json({ ok: true });
});

// Rotas protegidas
app.use('/api', requireAuth);

// ---------- Perfil e leitura completa dos dados ----------
app.get('/api/me', async (req, res) => {
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
});
app.patch('/api/me/profile', async (req, res) => {
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
});
app.patch('/api/me/reminders', async (req, res) => {
  if (typeof req.body?.lemb !== 'boolean') return fail(res, 400, 'Valor inválido.');
  await pool.execute('UPDATE users SET lemb = ? WHERE id = ?', [req.body.lemb, req.user.id]);
  res.json({ ok: true });
});
app.patch('/api/me/progress', async (req, res) => {
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
});
app.delete('/api/me', async (req, res) => {
  const [files]=await pool.execute(`SELECT file_path AS fp FROM documents WHERE user_id=? UNION ALL
   SELECT r.file_path AS fp FROM results r JOIN exams e ON e.id=r.exam_id WHERE e.user_id=?`,[req.user.id,req.user.id]);
  await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
  await Promise.all(files.map(f=>removeUpload(f.fp)));
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ---------- Consultas ----------
app.post('/api/appointments', async (req, res) => {
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
});
app.patch('/api/appointments/:id', async (req, res) => {
  if (!validId(req.params.id) || typeof req.body?.ok !== 'boolean') return fail(res, 400, 'Dados inválidos.');
  const [result] = await pool.execute(
    'UPDATE appointments SET confirmed = ? WHERE id = ? AND user_id = ?',
    [req.body.ok, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return fail(res, 404, 'Consulta não encontrada.');
  res.json({ ok: true });
});
app.delete('/api/appointments/:id', async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [result] = await pool.execute('DELETE FROM appointments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return fail(res, 404, 'Consulta não encontrada.');
  res.json({ ok: true });
});

// ---------- Exames ----------
app.post('/api/exams', async (req, res) => {
  const v = req.body || {};
  const name = str(v.name), date = validateDay(v.date);
  if (!name || name.length > 60 || !date || !STATUSES.includes(v.status)) return fail(res, 400, 'Dados do exame inválidos.');
  await transaction(async db => {
    await db.execute('INSERT INTO exams (user_id, name, exam_date, status) VALUES (?, ?, ?, ?)',
      [req.user.id, name, date, v.status]);
    await notification(db, req.user.id, 'Exame cadastrado', `${name} · ${v.status}`);
  });
  res.status(201).json({ ok: true });
});
app.patch('/api/exams/:id', async (req, res) => {
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
});
app.delete('/api/exams/:id', async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [files]=await pool.execute('SELECT r.file_path AS fp FROM results r JOIN exams e ON e.id=r.exam_id WHERE e.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  const [result] = await pool.execute('DELETE FROM exams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if(result.affectedRows)await Promise.all(files.map(f=>removeUpload(f.fp)));
  if (!result.affectedRows) return fail(res, 404, 'Exame não encontrado.');
  res.json({ ok: true });
});

// ---------- Notificações ----------
app.patch('/api/notifications/:id/read', async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, 'ID inválido.');
  const [result] = await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);
  if (!result.affectedRows) return fail(res, 404, 'Notificação não encontrada.');
  res.json({ ok: true });
});
app.post('/api/notifications/read-all', async (req, res) => {
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
});
app.delete('/api/notifications', async (req, res) => {
  await pool.execute('DELETE FROM notifications WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
});

// ---------- Mensagens: demonstração sem contato com equipes reais ----------
app.post('/api/messages', async (req, res) => {
  const body = str(req.body?.text);
  if (!body || body.length > 500) return fail(res, 400, 'Mensagem vazia ou maior que 500 caracteres.');
  await transaction(async db => {
    await db.execute('INSERT INTO messages (user_id, is_mine, body) VALUES (?, 1, ?)', [req.user.id, body]);
    await db.execute('INSERT INTO messages (user_id, is_mine, body) VALUES (?, 0, ?)',
      [req.user.id, 'Resposta automática de demonstração: sua mensagem foi registrada somente neste protótipo.']);
  });
  res.status(201).json({ ok: true });
});

// ---------- Profissionais, encaminhamentos, resultados e documentos ----------
const validText = (value,max)=>{const s=str(value);return s && s.length<=max ? s : null};
const optionalProfessional = async(value)=>{
  if(!value)return null;
  if(!validId(value))throw Object.assign(new Error('Profissional inválido.'),{status:400});
  const [rows]=await pool.execute('SELECT id FROM professionals WHERE id=? LIMIT 1',[value]);
  if(!rows.length)throw Object.assign(new Error('Profissional não encontrado.'),{status:400});
  return value;
};
function parseUpload(file){
  if(!file || typeof file!=='object' || !ALLOWED_MIMES[file.mime] ||
     typeof file.base64!=='string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64) ||
     !file.base64.length || file.base64.length>Math.ceil(MAX_FILE_BYTES/3)*4+4)
     throw Object.assign(new Error('Arquivo inválido. Envie PDF, JPG ou PNG com até 3 MB.'),{status:400});
  const bytes=Buffer.from(file.base64,'base64');
  if(!bytes.length || bytes.length>MAX_FILE_BYTES || bytes.toString('base64')!==file.base64)
     throw Object.assign(new Error('Arquivo inválido ou maior que 3 MB.'),{status:400});
  const valid=file.mime==='application/pdf'?bytes.subarray(0,5).toString()==='%PDF-':
    file.mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):
    bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex'));
  if(!valid)throw Object.assign(new Error('O conteúdo não corresponde ao formato declarado.'),{status:400});
  return {bytes,ext:ALLOWED_MIMES[file.mime],mime:file.mime,name:validText(file.name,150)||'arquivo'};
}
async function storeUpload(file){
  const f=parseUpload(file);
  await fs.mkdir(STORAGE,{recursive:true,mode:0o700});
  const stored=crypto.randomBytes(24).toString('hex')+f.ext;
  await fs.writeFile(path.join(STORAGE,stored),f.bytes,{flag:'wx',mode:0o600});
  return {...f,stored};
}
async function removeUpload(stored){
  if(stored && /^[a-f0-9]{48}\.(pdf|jpg|png)$/.test(stored))
    await fs.unlink(path.join(STORAGE,stored)).catch(()=>{});
}
async function sendProtectedFile(req,res,table,join){
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const sql=table==='documents'?
     'SELECT file_path AS filePath,mime_type AS mimeType,original_name AS name FROM documents WHERE id=? AND user_id=?':
     'SELECT r.file_path AS filePath,r.mime_type AS mimeType,r.original_name AS name FROM results r JOIN exams e ON e.id=r.exam_id WHERE r.id=? AND e.user_id=?';
  const [rows]=await pool.execute(sql,[req.params.id,req.user.id]);
  if(!rows.length || !rows[0].filePath)return fail(res,404,'Arquivo não encontrado.');
  const f=rows[0];
  if(!/^[a-f0-9]{48}\.(pdf|jpg|png)$/.test(f.filePath))return fail(res,404,'Arquivo não encontrado.');
  res.setHeader('Content-Type',f.mimeType);
  res.setHeader('Content-Disposition',`attachment; filename="${f.filePath}"`);
  res.setHeader('Cache-Control','no-store');
  return res.sendFile(path.join(STORAGE,f.filePath));
}
app.post('/api/professionals',async(req,res)=>{
  const name=validText(req.body?.name,150),specialty=str(req.body?.specialty),registration=str(req.body?.registration);
  if(!name || specialty.length>100 || registration.length>50)return fail(res,400,'Dados do profissional inválidos.');
  await pool.execute('INSERT INTO professionals (name,specialty,professional_registration) VALUES (?,?,?)',[name,specialty,registration]);
  res.status(201).json({ok:true});
});
app.post('/api/referrals',async(req,res)=>{
  const v=req.body||{},destination=validText(v.destination,150),reason=validText(v.reason,5000),date=validateDay(v.date);
  const professionalId=await optionalProfessional(v.professionalId);
  if(!destination||!reason||!date)return fail(res,400,'Dados do encaminhamento inválidos.');
  await pool.execute('INSERT INTO referrals (user_id,professional_id,destination,reason,referral_date) VALUES (?,?,?,?,?)',
    [req.user.id,professionalId,destination,reason,date]);
  res.status(201).json({ok:true});
});
app.patch('/api/referrals/:id',async(req,res)=>{
  const status=req.body?.status;
  if(!validId(req.params.id)||!['Pendente','Agendado','Concluído','Cancelado'].includes(status))return fail(res,400,'Situação inválida.');
  const [r]=await pool.execute('UPDATE referrals SET status=? WHERE id=? AND user_id=?',[status,req.params.id,req.user.id]);
  if(!r.affectedRows)return fail(res,404,'Encaminhamento não encontrado.');res.json({ok:true});
});
app.delete('/api/referrals/:id',async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [r]=await pool.execute('DELETE FROM referrals WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  if(!r.affectedRows)return fail(res,404,'Encaminhamento não encontrado.');res.json({ok:true});
});
app.post('/api/results',async(req,res)=>{
  const v=req.body||{},examId=validId(v.examId),description=validText(v.description,5000),date=validateDay(v.date);
  if(!examId||!description||!date)return fail(res,400,'Dados do resultado inválidos.');
  const [[exam]]=await pool.execute('SELECT id FROM exams WHERE id=? AND user_id=?',[examId,req.user.id]);
  if(!exam)return fail(res,404,'Exame não encontrado.');
  const file=v.file?await storeUpload(v.file):null;
  try{
    await pool.execute('INSERT INTO results (exam_id,description,result_date,file_path,original_name,mime_type) VALUES (?,?,?,?,?,?)',
      [examId,description,date,file?.stored||null,file?.name||null,file?.mime||null]);
  }catch(err){if(file)await removeUpload(file.stored);throw err;}
  res.status(201).json({ok:true});
});
app.delete('/api/results/:id',async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [rows]=await pool.execute('SELECT r.file_path AS filePath FROM results r JOIN exams e ON e.id=r.exam_id WHERE r.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  if(!rows.length)return fail(res,404,'Resultado não encontrado.');
  await pool.execute('DELETE r FROM results r JOIN exams e ON e.id=r.exam_id WHERE r.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  await removeUpload(rows[0].filePath);res.json({ok:true});
});
app.get('/api/results/:id/file',(req,res)=>sendProtectedFile(req,res,'results'));
app.post('/api/documents',async(req,res)=>{
  const name=validText(req.body?.name,150);
  if(!name)return fail(res,400,'Informe o nome do documento.');
  const file=await storeUpload(req.body?.file);
  try{
    await pool.execute('INSERT INTO documents (user_id,name,file_path,original_name,mime_type) VALUES (?,?,?,?,?)',
      [req.user.id,name,file.stored,file.name,file.mime]);
  }catch(err){await removeUpload(file.stored);throw err;}
  res.status(201).json({ok:true});
});
app.get('/api/documents/:id/file',(req,res)=>sendProtectedFile(req,res,'documents'));
app.delete('/api/documents/:id',async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [rows]=await pool.execute('SELECT file_path AS filePath FROM documents WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  if(!rows.length)return fail(res,404,'Documento não encontrado.');
  await pool.execute('DELETE FROM documents WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  await removeUpload(rows[0].filePath);res.json({ok:true});
});

// ---------- Arquivos do front-end ----------
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
  console.error('Erro do servidor:', err);
  if (err.status) return fail(res, err.status, err.message);
  if (err.type === 'entity.too.large') return fail(res, 413, 'Requisição muito grande.');
  if (err instanceof SyntaxError && 'body' in err) return fail(res, 400, 'JSON inválido.');
  return fail(res, 500, 'Falha interna. Verifique o terminal do servidor.');
});

async function start() {
  if (!process.env.DB_USER) throw new Error('Configure DB_USER no arquivo .env.');
  await pool.query('SELECT 1 FROM users LIMIT 1');
  app.listen(PORT, HOST, () => console.log(`TrilhaSaúde: http://${HOST}:${PORT}`));
}
start().catch(error => {
  console.error('Não foi possível iniciar. Verifique .env, MySQL e schema.sql:', error.message);
  process.exit(1);
});
