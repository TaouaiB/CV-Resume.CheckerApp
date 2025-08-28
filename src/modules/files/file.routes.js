// src/modules/files/file.routes.js
const express = require('express');
const upload = require('./multer.config');
const { authn } = require('../../security/authn');
const { uploadOneCtrl, streamByIdCtrl, deleteByIdCtrl } = require('./file.controller');

const router = express.Router();

router.post('/', authn, upload.single('file'), uploadOneCtrl);
router.get('/:id', authn, streamByIdCtrl);
router.delete('/:id', authn, deleteByIdCtrl);

module.exports = router;
