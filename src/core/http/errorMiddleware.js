const { ApiError } = require('../../shared/errors/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

function errorHandler(err, _req, res, _next) {
  // Zod error → 422 with details
  if (err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    return res.status(422).json({
      error: 'Validation error',
      issues: err.issues ?? err.errors ?? [],
    });
  }
  // ApiError → use status + message
  if (err instanceof ApiError || typeof err?.status === 'number') {
    return res.status(err.status).json({
      error: err.message || 'Error',
      ...(err.details ? { details: err.details } : {}),
    });
  }
  // Mongoose duplicate key, etc.
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key', details: err.keyValue });
  }
  // Fallback
  console.error('[ERROR]', err);
  return res.status(500).json({ error: 'Server error' });
}

module.exports = { notFound, errorHandler };
