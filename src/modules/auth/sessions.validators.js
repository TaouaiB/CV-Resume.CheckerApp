const { z } = require('zod');

const jtiParam = z.object({
  jti: z.string().regex(/^[a-f0-9]{32}$/i, 'Invalid session id'),
}).strict();

module.exports = { jtiParam };
