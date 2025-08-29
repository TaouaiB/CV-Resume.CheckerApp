const { getOrCreateMyProfile, updateMyProfile } = require('./profile.service');

async function getMeProfileCtrl(req, res, next) {
  try {
    const data = await getOrCreateMyProfile(req.user.id);
    res.json(data);
  } catch (e) { next(e); }
}

async function updateMeProfileCtrl(req, res, next) {
  try {
    const data = await updateMyProfile(req.user.id, req.body);
    res.json(data);
  } catch (e) { next(e); }
}

module.exports = { getMeProfileCtrl, updateMeProfileCtrl };
