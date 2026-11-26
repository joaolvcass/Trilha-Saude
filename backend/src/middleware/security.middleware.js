'use strict';

const { rateLimit } = require('express-rate-limit');

function securityMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', req.path.startsWith('/api/') ? 'no-store' : 'no-cache');
  // Proteção adicional de CSRF: a interface e a API rodam na mesma origem.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: 'Origem não permitida.' });
    }
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          return res.status(403).json({ error: 'Origem não permitida.' });
        }
      } catch {
        return res.status(403).json({ error: 'Origem não permitida.' });
      }
    }
  }
  next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' }
});

module.exports = { securityMiddleware, authLimiter };
