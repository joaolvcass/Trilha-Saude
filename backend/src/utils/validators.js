'use strict';

const { str } = require('./helpers');

function validateName(value) {
  const name = str(value);
  return name.length >= 2 && name.length <= 60 ? name : null;
}
function validateEmail(value) {
  const email = str(value).toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}
function validateDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value ? value : null;
}
function validateMoment(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(+date) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
function validId(value) { return /^[1-9]\d*$/.test(String(value)) ? value : null; }
const validText = (value,max)=>{const s=str(value);return s && s.length<=max ? s : null};

module.exports = { validateName, validateEmail, validatePassword, validateDay, validateMoment, validId, validText };
