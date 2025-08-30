const express = require('express');
const { validate } = require('../../shared/middleware/validate');
const { registerBody, loginBody } = require('./auth.validators');
const { verifyRequestBody, verifyConfirmBody } = require('./verify.validators');
const { forgotBody, resetBody } = require('./reset.validators');
const {
  registerCtrl,
  loginCtrl,
  refreshCtrl,
  logoutCtrl,
  verifyRequestCtrl,
  verifyConfirmCtrl,
  forgotPasswordCtrl,
  resetPasswordCtrl,
} = require('./auth.controller');

const { authn } = require('../../security/authn');
const { authorize } = require('../../security/authz');
const { SUBJECTS } = require('../../security/casl/subjects');
const RefreshToken = require('./refreshToken.model');
const { jtiParam } = require('./sessions.validators');
const {
  listSessionsCtrl,
  revokeOneCtrl,
  revokeAllCtrl,
} = require('./sessions.controller');
const {
  loginLimiter,
  registerLimiter,
  verifyRequestLimiter,
  resetRequestLimiter,
} = require('../../core/http/rateLimiters');

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

// password reset
router.post(
  '/password/forgot',
  resetRequestLimiter,
  validate({ body: forgotBody }),
  forgotPasswordCtrl
);
router.post(
  '/password/reset',
  validate({ body: resetBody }),
  resetPasswordCtrl
);

// sessions (user self-service)
router.get('/sessions', authn, listSessionsCtrl);

const loadSession = (req) => RefreshToken.findOne({ jti: req.params.jti });
router.post(
  '/sessions/:jti/revoke',
  authn,
  validate({ params: jtiParam }),
  authorize('delete', SUBJECTS.SESSION, loadSession),
  revokeOneCtrl
);

router.post('/sessions/revoke-all', authn, revokeAllCtrl);

// optional authn for /verify/request
function authnOptional(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next();
  require('../../security/authn').authn(req, _res, next);
}

module.exports = router;
