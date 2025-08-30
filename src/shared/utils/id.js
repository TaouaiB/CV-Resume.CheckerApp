const { randomBytes } = require('crypto');

function randomId(bytes = 16) { // 128-bit default
  return randomBytes(bytes).toString('hex');
}

module.exports = { randomId };
