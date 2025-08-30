const { initEnv, getConfig } = require('./env');
const { connectDb } = require('./../core/db/connect');
const { createApp } = require('./app');

async function main() {
  initEnv();
  const cfg = getConfig();

  await connectDb(cfg.mongoUri);

  const app = createApp({ allowedOrigins: cfg.allowedOrigins, env: cfg.env });
  app.listen(cfg.port, () => {
    console.log(`[API] listening on ${cfg.baseUrl} (${cfg.env})`);
  });
}

main().catch((err) => {
  console.error('[BOOT] Fatal error:', err);
  process.exit(1);
});
