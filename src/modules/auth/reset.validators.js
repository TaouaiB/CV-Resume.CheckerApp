const { z } = require('zod');

const email = z.string().email().max(254);
const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(v => /[a-z]/.test(v), 'Must include a lowercase letter')
  .refine(v => /[A-Z]/.test(v), 'Must include an uppercase letter')
  .refine(v => /\d/.test(v),    'Must include a digit');

const forgotBody = z.object({ email }).strict();
const resetBody  = z.object({
  token: z.string().min(20).max(400),
  newPassword: strongPassword,
}).strict();

module.exports = { forgotBody, resetBody };
