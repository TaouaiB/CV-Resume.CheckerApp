const User = require('./user.model');

async function meCtrl(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: String(user._id), email: user.email, role: user.role, status: user.status, createdAt: user.createdAt });
  } catch (e) { next(e); }
}

module.exports = { meCtrl };
