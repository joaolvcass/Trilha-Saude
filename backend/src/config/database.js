'use strict';

const mysql = require('mysql2/promise');

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

module.exports = { pool, transaction };
