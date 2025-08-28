// src/modules/files/file.controller.js
const fs = require('fs');
const { saveUploadedFile, getOwnedFilePath } = require('./file.service');

async function uploadOneCtrl(req, res, next) {
  try {
    const meta = await saveUploadedFile({ userId: req.user.id, file: req.file });
    res.status(201).json(meta);
  } catch (e) {
    next(e);
  }
}

async function streamByIdCtrl(req, res, next) {
  try {
    const { doc, absPath } = await getOwnedFilePath({ userId: req.user.id, fileId: req.params.id });

    res.setHeader('Content-Type', doc.mimetype);
    const safeName = encodeURIComponent(doc.originalName || doc.storage.filename);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    const stream = fs.createReadStream(absPath);
    stream.on('error', next);
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
}

module.exports = { uploadOneCtrl, streamByIdCtrl };
