const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function initEnv() {
  const env = process.env.NODE_ENV || 'development';
  // Prefer .env.<env> if present, else .env
  const candidate = path.join(process.cwd(), `.env.${env}`);
  const fallback = path.join(process.cwd(), `.env`);
  const file = fs.existsSync(candidate) ? candidate : (fs.existsSync(fallback) ? fallback : null);

  if (file) {
    dotenv.config({ path: file });
    console.log(`[ENV] Loaded ${path.basename(file)}`);
  } else {
    console.warn('[ENV] No .env file found. Using process env only.');
  }
}

function getConfig() {
  return {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
    mongoUri: process.env.MONGODB_URI || '',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
    uploadMaxMb: Number(process.env.MAX_UPLOAD_MB || 5),
  };
}

module.exports = { initEnv, getConfig };
