const { register, login, refresh, logout } = require('./auth.service');
const { requestVerify, confirmVerify } = require('./verify.service');

const COOKIE_NAME = 'rt';

function setRtCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: Number(process.env.REFRESH_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
  });
}

async function registerCtrl(req, res, next) {
  try {
    const ua = req.headers['user-agent'];
    const ip = req.ip;
    const out = await register({ email: req.body.email, password: req.body.password, ua, ip });
    setRtCookie(res, out.refreshToken);
    res.status(201).json({ user: out.user, accessToken: out.accessToken });
  } catch (e) { next(e); }
}

async function loginCtrl(req, res, next) {
  try {
    const ua = req.headers['user-agent'];
    const ip = req.ip;
    const out = await login({ email: req.body.email, password: req.body.password, ua, ip });
    setRtCookie(res, out.refreshToken);
    res.json({ user: out.user, accessToken: out.accessToken });
  } catch (e) { next(e); }
}

async function refreshCtrl(req, res, next) {
  try {
    const token = req.cookies?.rt || req.body?.refreshToken;
    const ua = req.headers['user-agent'];
    const ip = req.ip;
    const out = await refresh({ token, ua, ip });
    setRtCookie(res, out.refreshToken);
    res.json({ accessToken: out.accessToken });
  } catch (e) { next(e); }
}

async function logoutCtrl(req, res, next) {
  try {
    const token = req.cookies?.rt || req.body?.refreshToken;
    await logout({ token });
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function verifyRequestCtrl(req, res, next) {
  try {
    const ua = req.headers['user-agent'];
    const ip = req.ip;
    const userId = req.user?.id;
    const email = req.body?.email;
    const out = await requestVerify({ email, userId, ua, ip });

    // Don’t leak tokens in prod; expose in dev to simplify testing
    const payload = { ok: true };
    if ((process.env.MAIL_PROVIDER || 'devConsole') === 'devConsole') {
      payload.dev = { link: out.link, token: out.rawToken };
    }
    res.json(payload);
  } catch (e) { next(e); }
}

async function verifyConfirmCtrl(req, res, next) {
  try {
    const ua = req.headers['user-agent'];
    const ip = req.ip;
    const out = await confirmVerify({ token: req.body.token, ua, ip });
    setRtCookie(res, out.refreshToken);
    res.json({ user: out.user, accessToken: out.accessToken });
  } catch (e) { next(e); }
}

module.exports = { registerCtrl, loginCtrl, refreshCtrl, logoutCtrl, verifyRequestCtrl, verifyConfirmCtrl };
