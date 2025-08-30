function requireVerified(req, res, next) {
  if (req.user && req.user.emailVerified === true) return next();
  return res.status(403).json({ error: 'Email not verified' });
}
module.exports = { requireVerified };
