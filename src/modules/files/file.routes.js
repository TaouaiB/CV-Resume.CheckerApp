const express = require('express');
const fs = require('fs');              // <-- add
const path = require('path');          // <-- add
const upload = require('./multer.config');
const { authn } = require('../../security/authn');
const File = require('./file.model');

const router = express.Router();

/**
 * POST /api/v1/files
 * Auth required. Accepts one file field named "file".
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

/**
 * GET /api/v1/files/:id
 * Auth required. Only the owner (or admin later via CASL) can access.
 * Streams the file with correct Content-Type and inline disposition.
 */
router.get('/:id', authn, async (req, res, next) => {
  try {
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'File not found' });

    // Owner check (we'll refactor to CASL later)
    const isOwner = String(doc.ownerId) === String(req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    // Verify the file exists on disk
    const absPath = path.resolve(doc.storage.path);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Stored file missing on server' });
    }

    res.setHeader('Content-Type', doc.mimetype);
    // inline so browser previews PDFs; change to attachment to force download
    const safeName = encodeURIComponent(doc.originalName || doc.storage.filename);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    const stream = fs.createReadStream(absPath);
    stream.on('error', (err) => next(err));
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
