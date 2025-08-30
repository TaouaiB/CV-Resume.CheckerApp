const RefreshToken = require('./refreshToken.model');

function toPublicSession(s) {
  return {
    jti: s.jti,
    ip: s.ip || null,
    userAgent: s.userAgent || null,
    issuedAt: s.issuedAt || s.createdAt,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt || null,
    rotatedAt: s.rotatedAt || null,
    current: false, // controller can mark true if matches req.session.jti
  };
}

async function listUserSessions(userId) {
  const docs = await RefreshToken
    .find({ userId, /* optionally hide revoked: revokedAt: { $exists: false } */ })
    .sort({ createdAt: -1 })
    .lean();

  return docs.map(toPublicSession);
}

async function revokeSessionByJti(userId, jti) {
  // only touch the user's own session
  const res = await RefreshToken.updateOne(
    { userId, jti, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), reason: 'user-revoked' } }
  );
  return { ok: res.modifiedCount > 0 };
}

async function revokeAllSessions(userId) {
  const res = await RefreshToken.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), reason: 'user-revoke-all' } }
  );
  return { ok: res.modifiedCount > 0 };
}

module.exports = { listUserSessions, revokeSessionByJti, revokeAllSessions };
