const { randomBytes } = require('crypto');
const { sha256 } = require('../../shared/utils/hash');
const { ApiError } = require('../../shared/errors/ApiError');
const EmailToken = require('./emailToken.model');
const { sendVerifyEmail } = require('../../notifications/email.service');
const User = require('../users/user.model');
const RefreshToken = require('./refreshToken.model');
const {
  signAccessToken,
  signRefreshToken,
  refreshDays,
} = require('../../security/jwt');

function ttlMs() {
  const min = Number(process.env.EMAIL_TOKEN_TTL_MIN || 30);
  return min * 60 * 1000;
}

function buildVerifyLink(rawToken) {
  const base = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
  const route = process.env.VERIFY_ROUTE || '/verify-email';
  const url = `${base}${route}?token=${encodeURIComponent(rawToken)}`;
  return url;
}

async function requestVerify({ email, userId, ua, ip }) {
  let user = null;

  if (userId) {
    user = await User.findById(userId);
  } else if (email) {
    user = await User.findOne({ email });
  }

  // Always 200 externally; if no user or already verified, we do nothing.
  if (!user || user.emailVerified) return { ok: true };

  const raw = randomBytes(32).toString('hex');
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + ttlMs());

  await EmailToken.create({
    userId: user._id,
    purpose: 'verify',
    tokenHash,
    expiresAt,
    ip,
    userAgent: ua,
  });

  const link = buildVerifyLink(raw);
  await sendVerifyEmail({ to: user.email, link });
  return { ok: true, link, rawToken: raw }; // caller decides whether to expose raw token (dev only)
}

async function confirmVerify({ token, ua, ip }) {
  if (!token) throw ApiError.badRequest('Missing token');

  const tokenHash = sha256(token);
  const rec = await EmailToken.findOne({ tokenHash, purpose: 'verify' });

  if (!rec) throw ApiError.unauthorized('Invalid token');
  if (rec.consumedAt) throw ApiError.unauthorized('Token already used');
  if (rec.expiresAt < new Date()) throw ApiError.unauthorized('Token expired');

  const user = await User.findById(rec.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  // Mark token consumed and verify user
  rec.consumedAt = new Date();
  await rec.save();
  user.emailVerified = true;
  await user.save();

  // Revoke all existing sessions (logout everywhere)
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), reason: 'email-verified' } }
  );

  // Issue fresh pair bound to a new session
  const jti = require('../../shared/utils/id').randomId(16);
  const base = { sub: String(user._id), email: user.email, role: user.role };
  const accessToken = signAccessToken({ ...base, sid: jti });
  const refreshToken = signRefreshToken({ ...base, typ: 'refresh', jti });
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    jti,
    userId: user._id,
    expiresAt,
    userAgent: ua,
    ip,
  });

  return {
    user: {
      id: String(user._id),
      email: user.email,
      role: user.role,
      emailVerified: true,
    },
    accessToken,
    refreshToken,
  };
}

module.exports = { requestVerify, confirmVerify };
