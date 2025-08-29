const { ZodError } = require('zod');
const { ApiError } = require('../errors/ApiError');

// usage: validate({ body: schema, params: schema, query: schema })
function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (e) {
      // Pass Zod error through so errorHandler returns 422 with issues
      if (e instanceof ZodError) return next(e);
      return next(ApiError.unprocessable('Validation error', e?.message));
    }
  };
}

module.exports = { validate };
