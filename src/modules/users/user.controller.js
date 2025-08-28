// src/modules/users/user.controller.js
const { getUserPublicById } = require('./user.service');

async function meCtrl(req, res, next) {
  try {
    const data = await getUserPublicById(req.user.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { meCtrl };
