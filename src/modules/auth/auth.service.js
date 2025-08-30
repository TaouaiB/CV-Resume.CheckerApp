const User = require('../users/user.model');
const RefreshToken = require('./refreshToken.model');
const LoginAttempt = require('./loginAttempt.model');
const { hashPassword, comparePassword } = require('../../security/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshDays,
} = require('../../security/jwt');
const { ROLES } = require('../../shared/constants/roles');
const { randomId } = require('../../shared/utils/id');
const { ApiError } = require('../../shared/errors/ApiError');

function publicUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  };
}

function cookieOpts() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // true on HTTPS
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

const LOCK_MAX_ATTEMPTS = Number(process.env.AUTH_LOCK_MAX_ATTEMPTS || 5); // max failed attempts
const LOCK_WINDOW_MIN = Number(process.env.AUTH_LOCK_WINDOW_MIN || 15); // rolling window
const LOCK_DURATION_MIN = Number(process.env.AUTH_LOCK_DURATION_MIN || 15); // lock duration

async function login({ email, password, ua, ip }) {
  const user = await User.findOne({ email });

  // Unknown email → still log attempt, but generic error
  if (!user) {
    await LoginAttempt.create({
      email,
      ip,
      userAgent: ua,
      success: false,
      reason: 'invalid-credentials',
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Hard block
  if (user.status && user.status !== 'ACTIVE') {
    await LoginAttempt.create({
      email,
      userId: user._id,
      ip,
      userAgent: ua,
      success: false,
      reason: 'blocked',
    });
    throw ApiError.forbidden('Account is not active');
  }

  // Lockout check
  const now = new Date();
  if (user.lockUntil && user.lockUntil > now) {
    await LoginAttempt.create({
      email,
      userId: user._id,
      ip,
      userAgent: ua,
      success: false,
      reason: 'locked',
    });
    throw ApiError.locked(
      `Account temporarily locked. Try again after ${Math.ceil((user.lockUntil - now) / 60000)} minutes`
    );
  }

  // Password check
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    // rolling window update
    const windowStart = user.lastFailedAt ? user.lastFailedAt.getTime() : 0;
    const inWindow = now.getTime() - windowStart <= LOCK_WINDOW_MIN * 60 * 1000;
    user.failedLoginCount = inWindow ? user.failedLoginCount + 1 : 1;
    user.lastFailedAt = now;

    // apply lock if threshold reached
    if (user.failedLoginCount >= LOCK_MAX_ATTEMPTS) {
      user.lockUntil = new Date(now.getTime() + LOCK_DURATION_MIN * 60 * 1000);
      user.failedLoginCount = 0; // reset counter after lock
    }
    await user.save();
    await LoginAttempt.create({
      email,
      userId: user._id,
      ip,
      userAgent: ua,
      success: false,
      reason: 'invalid-credentials',
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  // success → reset counters
  if (user.failedLoginCount || user.lastFailedAt || user.lockUntil) {
    user.failedLoginCount = 0;
    user.lastFailedAt = undefined;
    user.lockUntil = undefined;
    await user.save();
  }

  const out = await issueTokensForUser(user, { ua, ip });
  await LoginAttempt.create({
    email,
    userId: user._id,
    ip,
    userAgent: ua,
    success: true,
  });
  return { user: publicUser(user), ...out };
}

async function issueTokensForUser(user, { ua, ip }) {
  const jti = randomId(16);
  const base = { sub: String(user._id), email: user.email, role: user.role };

  // Bind access token to session via `sid`
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
    await RefreshToken.updateMany(
      { userId: session.userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date(), reason: 'reuse-detected' } }
    );
    throw ApiError.unauthorized('Token reuse detected; all sessions revoked');
  }
  if (session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  // rotate: mark old as rotated, issue new pair
  await RefreshToken.updateOne(
    { _id: session._id },
    { $set: { rotatedAt: new Date(), reason: 'rotation' } }
  );

  const user = await User.findById(session.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  const { accessToken, refreshToken } = await issueTokensForUser(user, {
    ua,
    ip,
  });
  return { accessToken, refreshToken };
}

async function logout({ token }) {
  if (!token) return { ok: true }; // nothing to do
  try {
    const decoded = verifyRefreshToken(token);
    if (decoded?.jti) {
      await RefreshToken.updateOne(
        { jti: decoded.jti },
        { $set: { revokedAt: new Date(), reason: 'logout' } }
      );
    }
  } catch (_) {
    /* ignore */
  }
  return { ok: true };
}

module.exports = { register, login, refresh, logout, publicUser };
