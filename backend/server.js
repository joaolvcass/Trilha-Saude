'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

async function start() {
  if (!process.env.DB_USER) throw new Error('Configure DB_USER no arquivo .env.');
  await pool.query('SELECT 1 FROM users LIMIT 1');
  app.listen(PORT, HOST, () => console.log(`TrilhaSaúde: http://${HOST}:${PORT}`));
}
start().catch(error => {
  console.error('Não foi possível iniciar. Verifique .env, MySQL e schema.sql:', error.message);
  process.exit(1);
});
