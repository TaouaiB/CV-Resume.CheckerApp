const express = require('express');
const upload = require('./multer.config');
const { authn } = require('../../security/authn');
const File = require('./file.model');

const router = express.Router();

/**
 * POST /api/v1/files
 * Auth required. Accepts one file field named "file".
 * Returns file metadata id.
 */
router.post('/', authn, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = await File.create({
      ownerId: req.user.id,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storage: {
        adapter: 'local',
        path: req.file.path,
        filename: req.file.filename,
      },
    });

    res.status(201).json({
      id: String(doc._id),
      name: doc.originalName,
      mimetype: doc.mimetype,
      size: doc.size,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
