const express = require('express');
const { validate } = require('../../shared/middleware/validate');
const { registerBody, loginBody } = require('./auth.validators');
const { registerCtrl, loginCtrl } = require('./auth.controller');

const router = express.Router();

router.post('/register', validate({ body: registerBody }), registerCtrl);
router.post('/login', validate({ body: loginBody }), loginCtrl);

module.exports = router;
