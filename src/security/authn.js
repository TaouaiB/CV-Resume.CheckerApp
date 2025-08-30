const { verifyAccessToken } = require('./jwt');
const RefreshToken = require('../modules/auth/refreshToken.model');
const User = require('../modules/users/user.model');

async function authn(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const p = verifyAccessToken(token);

    // Backward compatibility: if old tokens have no `sid`, allow ONLY if you want.
    // To require strict session-bound access, uncomment the next line:
    if (!p.sid)
      return res.status(401).json({ error: 'Invalid token (no session id)' });

    if (p.sid) {
      // Validate the session behind this access token
      const session = await RefreshToken.findOne({ jti: p.sid });
      if (!session) return res.status(401).json({ error: 'Session not found' });
      if (session.revokedAt)
        return res.status(401).json({ error: 'Session revoked' });
      if (session.expiresAt < new Date())
        return res.status(401).json({ error: 'Session expired' });
      // Optional: if you also treat rotated sessions as invalid for old access tokens:
      if (session.rotatedAt)
        return res.status(401).json({ error: 'Session rotated' });
      req.session = { jti: session.jti, userId: String(session.userId) };
    }

    // Optional extra hardening: ensure user still exists and is ACTIVE
    const user = await User.findById(p.sub).select('_id role email status');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authn };
