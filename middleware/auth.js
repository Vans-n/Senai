const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return next({ status: 401, code: 'TOKEN_MISSING', message: 'Token not provided' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return next({ status: 401, code: 'TOKEN_ERROR', message: 'Token error' });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return next({ status: 401, code: 'TOKEN_MALFORMED', message: 'Malformed token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next({ status: 401, code: 'TOKEN_INVALID', message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;
