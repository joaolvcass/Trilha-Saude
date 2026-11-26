'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

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

module.exports = { hashPassword, checkPassword };
