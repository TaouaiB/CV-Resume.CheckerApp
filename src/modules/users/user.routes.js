const express = require('express');
const { authn } = require('../../security/authn');
const { meCtrl } = require('./user.controller');

const router = express.Router();

router.get('/me', authn, meCtrl);

module.exports = router;
