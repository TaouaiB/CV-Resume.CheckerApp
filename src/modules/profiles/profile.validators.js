// src/modules/profiles/profile.validators.js
const { z } = require('zod');

const updateBody = z
  .object({
    headline: z.string().max(100).optional(),
    bio: z.string().max(2000).optional(),
    skills: z.array(z.string().min(1).max(40)).max(100).optional(),
    links: z.array(z.string().url().max(200)).max(50).optional(),
    languages: z.array(z.string().min(1).max(40)).max(20).optional(),
    location: z.string().max(100).optional(),
    avatarUrl: z.string().url().max(200).optional(),
  })
  .strict();

module.exports = { updateBody };
