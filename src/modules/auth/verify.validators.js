// src/modules/auth/verify.validators.js
const { z } = require('zod');

const verifyRequestBody = z
  .object({
    email: z.string().email().max(254).optional(),
  })
  .default({});

const verifyConfirmBody = z.object({
  token: z.string().min(20).max(400),
}).strict();

module.exports = { verifyRequestBody, verifyConfirmBody };
