const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');

const { notFound, errorHandler } = require('./http/errorMiddleware');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const fileRoutes = require('../modules/files/file.routes');
const profileRoutes = require('../modules/profiles/profile.routes');

function createApp({ allowedOrigins, env }) {
  const app = express();
  const isDev = env === 'development';

  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));

  // Dev uses 'dev' format; prod can use 'combined'
  app.use(morgan(isDev ? 'dev' : 'combined'));

  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: false,
    })
  );

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/files', fileRoutes);
  app.use('/api/v1/profiles', profileRoutes);

  app.get('/health', async (req, res) => {
    try {
      const dbStatus = mongoose.connection.readyState;
      const dbStatusText =
        {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting',
        }[dbStatus] || 'unknown';

      res.json({
        ok: true,
        env,
        ts: Date.now(),
        database: {
          status: dbStatusText,
          readyState: dbStatus,
          connected: dbStatus === 1,
        },
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Health check failed',
        details: error.message,
      });
    }
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Server error' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
