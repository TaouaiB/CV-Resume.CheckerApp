const jwt = require('jsonwebtoken');

const accessMin = Number(process.env.ACCESS_TTL_MIN || 15);
const refreshDays = Number(process.env.REFRESH_TTL_DAYS || 7);

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: `${accessMin}m`,
  });
}
function signRefreshToken(payloadWithJti) {
  // payload must include { jti, sub, email, role, typ:'refresh' }
  return jwt.sign(payloadWithJti, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${refreshDays}d`,
  });
}
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshDays,
};
