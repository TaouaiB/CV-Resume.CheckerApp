const { register, login } = require('./auth.service');

async function registerCtrl(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const data = await register({ email, password });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

async function loginCtrl(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const data = await login({ email, password });
    res.json(data);
  } catch (e) { next(e); }
}

module.exports = { registerCtrl, loginCtrl };
