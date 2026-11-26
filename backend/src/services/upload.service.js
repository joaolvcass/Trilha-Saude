'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
const { STORAGE, ALLOWED_MIMES, MAX_FILE_BYTES } = require('../constants/system.constants');
const { pool } = require('../config/database');
const { validText, validId } = require('../utils/validators');
const { fail } = require('../utils/helpers');

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

module.exports = { storeUpload, removeUpload, sendProtectedFile };
