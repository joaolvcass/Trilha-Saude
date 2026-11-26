'use strict';

const { pool } = require('../config/database');
const { validText, validId } = require('../utils/validators');
const { fail } = require('../utils/helpers');
const { storeUpload, removeUpload, sendProtectedFile } = require('../services/upload.service');

const createDocument = async(req,res)=>{
  const name=validText(req.body?.name,150);
  if(!name)return fail(res,400,'Informe o nome do documento.');
  const file=await storeUpload(req.body?.file);
  try{
    await pool.execute('INSERT INTO documents (user_id,name,file_path,original_name,mime_type) VALUES (?,?,?,?,?)',
      [req.user.id,name,file.stored,file.name,file.mime]);
  }catch(err){await removeUpload(file.stored);throw err;}
  res.status(201).json({ok:true});
};

const getDocumentFile = (req,res)=>sendProtectedFile(req,res,'documents');

const deleteDocument = async(req,res)=>{
  if(!validId(req.params.id))return fail(res,400,'ID inválido.');
  const [rows]=await pool.execute('SELECT file_path AS filePath FROM documents WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  if(!rows.length)return fail(res,404,'Documento não encontrado.');
  await pool.execute('DELETE FROM documents WHERE id=? AND user_id=?',[req.params.id,req.user.id]);
  await removeUpload(rows[0].filePath);res.json({ok:true});
};

module.exports = { createDocument, getDocumentFile, deleteDocument };
