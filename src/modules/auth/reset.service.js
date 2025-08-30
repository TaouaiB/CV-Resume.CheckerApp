const { randomBytes } = require('crypto');
const { sha256 } = require('../../shared/utils/hash');
const { ApiError } = require('../../shared/errors/ApiError');
const EmailToken = require('./emailToken.model');
const User = require('../users/user.model');
const RefreshToken = require('./refreshToken.model');
const { signAccessToken, signRefreshToken, refreshDays } = require('../../security/jwt');
const { hashPassword, comparePassword } = require('../../security/password');
const { randomId } = require('../../shared/utils/id');
const { sendPasswordResetEmail } = require('../../notifications/email.service');

function ttlMs() {
  const min = Number(process.env.RESET_TOKEN_TTL_MIN || process.env.EMAIL_TOKEN_TTL_MIN || 30);
  return min * 60 * 1000;
}

function buildResetLink(rawToken) {
  const base = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
  const route = process.env.RESET_ROUTE || '/reset-password';
  return `${base}${route}?token=${encodeURIComponent(rawToken)}`;
}

async function requestPasswordReset({ email, ua, ip }) {
  const user = await User.findOne({ email });

  // Always appear successful to avoid enumeration
  if (!user) return { ok: true };

  const raw = randomBytes(32).toString('hex');
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + ttlMs());

  await EmailToken.create({
    userId: user._id,
    purpose: 'reset_password',
    tokenHash,
    expiresAt,
    ip,
    userAgent: ua,
  });

  const link = buildResetLink(raw);
  // Send email (dev provider logs to console)
  await sendPasswordResetEmail({ to: user.email, link });

  return { ok: true, link, rawToken: raw };
}

async function confirmPasswordReset({ token, newPassword, ua, ip }) {
  if (!token) throw ApiError.badRequest('Missing token');
  const tokenHash = sha256(token);
  const rec = await EmailToken.findOne({ tokenHash, purpose: 'reset_password' });
  if (!rec) throw ApiError.unauthorized('Invalid token');
  if (rec.consumedAt) throw ApiError.unauthorized('Token already used');
  if (rec.expiresAt < new Date()) throw ApiError.unauthorized('Token expired');

  const user = await User.findById(rec.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  // Disallow password reuse
  const same = await comparePassword(newPassword, user.passwordHash);
  if (same) throw ApiError.unprocessable('New password must be different from the old one');

  // Update password
  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Consume token
  rec.consumedAt = new Date();
  await rec.save();

  // Revoke all sessions
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), reason: 'password-reset' } }
  );

  // Issue fresh pair bound to new session
  const jti = randomId(16);
  const base = { sub: String(user._id), email: user.email, role: user.role };
  const accessToken = signAccessToken({ ...base, sid: jti });
  const refreshToken = signRefreshToken({ ...base, typ: 'refresh', jti });
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ jti, userId: user._id, expiresAt, userAgent: ua, ip });

  return { user: { id: String(user._id), email: user.email, role: user.role, emailVerified: !!user.emailVerified }, accessToken, refreshToken };
}

module.exports = { requestPasswordReset, confirmPasswordReset };
