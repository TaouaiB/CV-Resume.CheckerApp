const User = require('../users/user.model');
const RefreshToken = require('./refreshToken.model');
const { hashPassword, comparePassword } = require('../../security/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken, refreshDays } = require('../../security/jwt');
const { ROLES } = require('../../shared/constants/roles');
const { randomId } = require('../../shared/utils/id');
const { ApiError } = require('../../shared/errors/ApiError');

function publicUser(u) {
  return { id: String(u._id), email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

function cookieOpts() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,             // true on HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: refreshDays * 24 * 60 * 60 * 1000,
  };
}

async function register({ email, password, ua, ip }) {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already registered');

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, role: ROLES.USER });
  const out = await issueTokensForUser(user, { ua, ip });
  return { user: publicUser(user), ...out };
}

async function login({ email, password, ua, ip }) {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');
  const out = await issueTokensForUser(user, { ua, ip });
  return { user: publicUser(user), ...out };
}

async function issueTokensForUser(user, { ua, ip }) {
  const jti = randomId(16);
  const payload = { sub: String(user._id), email: user.email, role: user.role };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken({ ...payload, typ: 'refresh', jti });

  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ jti, userId: user._id, expiresAt, userAgent: ua, ip });

  return { accessToken, refreshToken };
}

async function refresh({ token, ua, ip }) {
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  if (decoded.typ !== 'refresh' || !decoded.jti) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const session = await RefreshToken.findOne({ jti: decoded.jti });
  if (!session) throw ApiError.unauthorized('Refresh session not found');

  if (session.revokedAt) {
    // reuse detected or logged out; revoke all user sessions to be safe
    await RefreshToken.updateMany({ userId: session.userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date(), reason: 'reuse-detected' } });
    throw ApiError.unauthorized('Token reuse detected; all sessions revoked');
  }
  if (session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  // rotate: mark old as rotated, issue new pair
  await RefreshToken.updateOne({ _id: session._id }, { $set: { rotatedAt: new Date(), reason: 'rotation' } });

  const user = await User.findById(session.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  const { accessToken, refreshToken } = await issueTokensForUser(user, { ua, ip });
  return { accessToken, refreshToken };
}

async function logout({ token }) {
  if (!token) return { ok: true }; // nothing to do
  try {
    const decoded = verifyRefreshToken(token);
    if (decoded?.jti) {
      await RefreshToken.updateOne({ jti: decoded.jti }, { $set: { revokedAt: new Date(), reason: 'logout' } });
    }
  } catch (_) { /* ignore */ }
  return { ok: true };
}

module.exports = { register, login, refresh, logout, publicUser };
