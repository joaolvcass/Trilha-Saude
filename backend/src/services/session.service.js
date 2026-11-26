'use strict';

const crypto = require('node:crypto');
const { COOKIE, SESSION_SECONDS } = require('../constants/system.constants');

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

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

module.exports = { hashToken, setSessionCookie, clearSessionCookie, readToken, createSession };
