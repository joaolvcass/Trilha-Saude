'use strict';

const { pool } = require('../config/database');
const { validText } = require('../utils/validators');
const { str, fail } = require('../utils/helpers');

const createProfessional = async(req,res)=>{
  const name=validText(req.body?.name,150),specialty=str(req.body?.specialty),registration=str(req.body?.registration);
  if(!name || specialty.length>100 || registration.length>50)return fail(res,400,'Dados do profissional inválidos.');
  await pool.execute('INSERT INTO professionals (name,specialty,professional_registration) VALUES (?,?,?)',[name,specialty,registration]);
  res.status(201).json({ok:true});
};

module.exports = { createProfessional };
