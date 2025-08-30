const devProvider = require('./providers/devConsole.provider');

function getProvider() {
  const name = (process.env.MAIL_PROVIDER || 'devConsole').toLowerCase();
  // Extend here (smtp/sendgrid) in future
  return devProvider;
}

async function sendVerifyEmail({ to, link }) {
  const subject = 'Verify your email';
  const text = `Click the link to verify your email: ${link}`;
  const html = `<p>Click the link to verify your email:</p><p><a href="${link}">${link}</a></p>`;
  const provider = getProvider();
  return provider.send({ to, subject, html, text });
}

module.exports = { sendVerifyEmail };
