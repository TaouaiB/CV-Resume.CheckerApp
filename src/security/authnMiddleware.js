const { verifyAccessToken } = require('./jwt');

function authn(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const p = verifyAccessToken(token);
    req.user = { id: p.sub, role: p.role, email: p.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authn };
