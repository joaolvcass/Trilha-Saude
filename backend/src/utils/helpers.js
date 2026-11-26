'use strict';

const str = value => typeof value === 'string' ? value.trim() : '';
function fail(res, status, error) { return res.status(status).json({ error }); }

module.exports = { str, fail };
