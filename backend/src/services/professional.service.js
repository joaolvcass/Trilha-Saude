'use strict';

const { pool } = require('../config/database');
const { validId } = require('../utils/validators');

const optionalProfessional = async(value)=>{
  if(!value)return null;
  if(!validId(value))throw Object.assign(new Error('Profissional inválido.'),{status:400});
  const [rows]=await pool.execute('SELECT id FROM professionals WHERE id=? LIMIT 1',[value]);
  if(!rows.length)throw Object.assign(new Error('Profissional não encontrado.'),{status:400});
  return value;
};

module.exports = { optionalProfessional };
