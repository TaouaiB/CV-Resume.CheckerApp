const express = require('express');
const { authn } = require('../../security/authn');
const { validate } = require('../../shared/middleware/validate');
const { updateBody } = require('./profile.validators');
const { getMeProfileCtrl, updateMeProfileCtrl } = require('./profile.controller');

const router = express.Router();

// /profiles/me is inherently “self”; authn is sufficient (CASL used for admin/all later)
router.get('/me', authn, getMeProfileCtrl);
router.put('/me', authn, validate({ body: updateBody }), updateMeProfileCtrl);

module.exports = router;
