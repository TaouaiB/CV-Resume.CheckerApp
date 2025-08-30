const express = require('express');
const { validate } = require('../../shared/middleware/validate');
const { registerBody, loginBody } = require('./auth.validators');
const {
  registerCtrl,
  loginCtrl,
  refreshCtrl,
  logoutCtrl,
} = require('./auth.controller');
const {
  loginLimiter,
  registerLimiter,
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

module.exports = router;
