const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'academizer-dev-jwt-change-me';

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

const authenticate = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.auth = jwt.verify(h.slice(7), JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.auth?.role || !roles.includes(req.auth.role)) {
    return res.status(403).json({ error: 'Access denied for this role' });
  }
  return next();
};

module.exports = { authenticate, requireRole, signToken, JWT_SECRET };
