'use strict';

const { pool } = require('../config/database');
const { validId, validText, validateDay } = require('../utils/validators');
const { fail } = require('../utils/helpers');
const { storeUpload, removeUpload, sendProtectedFile } = require('../services/upload.service');

const createResult = async(req,res)=>{
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
};

const deleteResult = async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [rows]=await pool.execute('SELECT r.file_path AS filePath FROM results r JOIN exams e ON e.id=r.exam_id WHERE r.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  if(!rows.length)return fail(res,404,'Resultado não encontrado.');
  await pool.execute('DELETE r FROM results r JOIN exams e ON e.id=r.exam_id WHERE r.id=? AND e.user_id=?',[req.params.id,req.user.id]);
  await removeUpload(rows[0].filePath);res.json({ok:true});
};

const getResultFile = (req,res)=>sendProtectedFile(req,res,'results');

module.exports = { createResult, deleteResult, getResultFile };
