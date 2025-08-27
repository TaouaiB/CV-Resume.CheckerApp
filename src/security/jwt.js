const jwt = require('jsonwebtoken');

const accessMin = Number(process.env.ACCESS_TTL_MIN || 15);
const refreshDays = Number(process.env.REFRESH_TTL_DAYS || 7);

function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET;
  return jwt.sign(payload, secret, { expiresIn: `${accessMin}m` });
}
function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET;
  return jwt.sign(payload, secret, { expiresIn: `${refreshDays}d` });
}
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
