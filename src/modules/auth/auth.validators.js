const { z } = require('zod');

const email = z.string().email().max(254);
const password = z.string().min(8).max(128); // tweak later (complexity rules)

const registerBody = z.object({ email, password });
const loginBody = z.object({ email, password });

module.exports = { registerBody, loginBody };
