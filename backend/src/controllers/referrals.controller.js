'use strict';

const { pool } = require('../config/database');
const { validText, validateDay, validId } = require('../utils/validators');
const { fail } = require('../utils/helpers');
const { optionalProfessional } = require('../services/professional.service');

const createReferral = async(req,res)=>{
  const v=req.body||{},destination=validText(v.destination,150),reason=validText(v.reason,5000),date=validateDay(v.date);
  const professionalId=await optionalProfessional(v.professionalId);
  if(!destination||!reason||!date)return fail(res,400,'Dados do encaminhamento inválidos.');
  await pool.execute('INSERT INTO referrals (user_id,professional_id,destination,reason,referral_date) VALUES (?,?,?,?,?)',
    [req.user.id,professionalId,destination,reason,date]);
  res.status(201).json({ok:true});
};

const updateReferral = async(req,res)=>{
  const status=req.body?.status;
  if(!validId(req.params.id)||!['Pendente','Agendado','Concluído','Cancelado'].includes(status))return fail(res,400,'Situação inválida.');
  const [r]=await pool.execute('UPDATE referrals SET status=? WHERE id=? AND user_id=?',[status,req.params.id,req.user.id]);
  if(!r.affectedRows)return fail(res,404,'Encaminhamento não encontrado.');res.json({ok:true});
};

const deleteReferral = async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [r]=await pool.execute('DELETE FROM referrals WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  if(!r.affectedRows)return fail(res,404,'Encaminhamento não encontrado.');res.json({ok:true});
};

module.exports = { createReferral, updateReferral, deleteReferral };
