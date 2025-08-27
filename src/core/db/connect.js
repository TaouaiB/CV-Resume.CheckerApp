// src/core/db/connect.js
const mongoose = require('mongoose');

let isHookedForShutdown = false;

/**
 * Connect to MongoDB (safe to call even if URI is empty).
 * - Logs helpful events
 * - Enables mongoose debug in development
 * - AutoIndex only outside production
 */
async function connectDb(mongoUri) {
  if (!mongoUri) {
    console.warn('[DB] No MONGODB_URI set. Skipping DB connection (dev mode).');
    return null;
  }

  const env = process.env.NODE_ENV || 'development';

  // Optional but nice in dev: see the queries in the console
  if (env === 'development') {
    mongoose.set('debug', true);
  }

  // Sensible defaults
  const conn = await mongoose.connect(mongoUri, {
    autoIndex: env !== 'production', // faster prod startup
    maxPoolSize: 10,                 // reasonable pool
  });

  const db = mongoose.connection;

  db.on('connected', () => {
    console.log('[DB] MongoDB connected');
  });

  db.on('error', (err) => {
    console.error('[DB] MongoDB error:', err.message);
  });

  db.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  // Graceful shutdown handlers (register once)
  if (!isHookedForShutdown) {
    isHookedForShutdown = true;
    const shutdown = async (signal) => {
      try {
        console.log(`[DB] ${signal} received → closing MongoDB connection...`);
        await mongoose.disconnect();
        console.log('[DB] MongoDB connection closed. Bye.');
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  return conn;
}

module.exports = { connectDb };
