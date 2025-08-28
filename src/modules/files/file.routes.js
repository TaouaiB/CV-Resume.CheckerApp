const express = require('express');
const upload = require('./multer.config');
const { authn } = require('../../security/authn');
const { authorize } = require('../../security/authz');
const { SUBJECTS } = require('../../security/casl/subjects');
const File = require('./file.model');
const { uploadOneCtrl, streamByIdCtrl, deleteByIdCtrl } = require('./file.controller');

const router = express.Router();

router.post('/', authn, upload.single('file'), uploadOneCtrl);

// Pre-load file for CASL checks
const loadFile = (req) => File.findById(req.params.id);

// Read (owner or admin)
router.get('/:id', authn, authorize('read', SUBJECTS.FILE, loadFile), streamByIdCtrl);

// Delete (owner or admin)
router.delete('/:id', authn, authorize('delete', SUBJECTS.FILE, loadFile), deleteByIdCtrl);

module.exports = router;
