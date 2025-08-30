class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
  static badRequest(msg = 'Bad request', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Conflict') { return new ApiError(409, msg); }
  static unprocessable(msg = 'Validation error', details) { return new ApiError(422, msg, details); }
  static tooMany(msg = 'Too many requests') { return new ApiError(429, msg); }
  static locked(msg = 'Account locked') { return new ApiError(423, msg); } 
  static server(msg = 'Server error') { return new ApiError(500, msg); }
}
module.exports = { ApiError };
