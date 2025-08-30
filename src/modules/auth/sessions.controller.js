const RefreshToken = require('./refreshToken.model');
const { listUserSessions, revokeSessionByJti, revokeAllSessions } = require('./sessions.service');

async function listSessionsCtrl(req, res, next) {
  try {
    const items = await listUserSessions(req.user.id);
    const currentSid = req.session?.jti;
    const withFlag = items.map(s => ({ ...s, current: s.jti === currentSid }));
    res.json({ items });
  } catch (e) { next(e); }
}

async function revokeOneCtrl(req, res, next) {
  try {
    // authorize middleware already loaded and checked the session doc
    const jti = req.params.jti;
    const out = await revokeSessionByJti(req.user.id, jti);
    res.json(out);
  } catch (e) { next(e); }
}

async function revokeAllCtrl(req, res, next) {
  try {
    const out = await revokeAllSessions(req.user.id);
    res.json(out);
  } catch (e) { next(e); }
}

module.exports = { listSessionsCtrl, revokeOneCtrl, revokeAllCtrl };
