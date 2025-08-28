// src/modules/files/file.service.js
const fs = require('fs');
const path = require('path');
const File = require('./file.model');

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function saveUploadedFile({ userId, file }) {
  if (!file) throw httpError(400, 'No file uploaded');

  const doc = await File.create({
    ownerId: userId,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    storage: {
      adapter: 'local',
      path: file.path,
      filename: file.filename,
    },
  });

  return {
    id: String(doc._id),
    name: doc.originalName,
    mimetype: doc.mimetype,
    size: doc.size,
    createdAt: doc.createdAt,
  };
}

async function getOwnedFilePath({ userId, fileId }) {
  const doc = await File.findById(fileId);
  if (!doc) throw httpError(404, 'File not found');

  const isOwner = String(doc.ownerId) === String(userId);
  if (!isOwner) throw httpError(403, 'Forbidden');

  const absPath = path.resolve(doc.storage.path);
  if (!fs.existsSync(absPath))
    throw httpError(404, 'Stored file missing on server');

  return { doc, absPath };
}

async function deleteOwnedFile({ userId, fileId }) {
  const doc = await File.findById(fileId);
  if (!doc) throw httpError(404, 'File not found');

  const isOwner = String(doc.ownerId) === String(userId);
  if (!isOwner) throw httpError(403, 'Forbidden');

  // try to remove from disk; ignore if already missing
  try {
    const absPath = path.resolve(doc.storage.path);
    if (fs.existsSync(absPath)) {
      await fs.promises.unlink(absPath);
    }
  } catch (_) {
    // swallow disk errors (we still remove DB doc)
  }

  await doc.deleteOne();
  return { ok: true };
}

module.exports = { saveUploadedFile, getOwnedFilePath, deleteOwnedFile };
