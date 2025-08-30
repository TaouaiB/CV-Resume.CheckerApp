const express = require('express');
const { validate } = require('../../shared/middleware/validate');
const { registerBody, loginBody } = require('./auth.validators');
const { verifyRequestBody, verifyConfirmBody } = require('./verify.validators');
const {
  registerCtrl,
  loginCtrl,
  refreshCtrl,
  logoutCtrl,
  verifyRequestCtrl,
  verifyConfirmCtrl,
} = require('./auth.controller');
const {
  loginLimiter,
  registerLimiter,
  verifyRequestLimiter,
} = require('../../core/http/rateLimiters');
const { authn } = require('../../security/authn');

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  validate({ body: registerBody }),
  registerCtrl
);
router.post('/login', loginLimiter, validate({ body: loginBody }), loginCtrl);
router.post('/refresh', refreshCtrl);
router.post('/logout', logoutCtrl);

// email verification
router.post(
  '/verify/request',
  verifyRequestLimiter,
  validate({ body: verifyRequestBody }),
  authnOptional,
  verifyRequestCtrl
);
router.post(
  '/verify/confirm',
  validate({ body: verifyConfirmBody }),
  verifyConfirmCtrl
);

// optional authn for request endpoint: if logged-in, ignore body email
function authnOptional(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(); // not logged in is fine
  // reuse existing authn middleware partially
  require('../../security/authn').authn(req, _res, next);
}

module.exports = router;
