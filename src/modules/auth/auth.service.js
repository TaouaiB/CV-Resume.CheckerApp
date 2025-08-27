const User = require('../users/user.model');
const { hashPassword, comparePassword } = require('../../security/password');
const { signAccessToken, signRefreshToken } = require('../../security/jwt');
const { ROLES } = require('../../shared/constants/roles');

async function register({ email, password }) {
  const exists = await User.findOne({ email });
  if (exists) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, role: ROLES.USER });

  const tokens = issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const tokens = issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

function issueTokens(user) {
  const payload = { sub: String(user._id), email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ ...payload, typ: 'refresh' }),
  };
}

function publicUser(u) {
  return { id: String(u._id), email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

module.exports = { register, login };
