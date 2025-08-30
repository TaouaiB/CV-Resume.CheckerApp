const devProvider = require('./providers/devConsole.provider');
const smtpProvider = require('./providers/smtp.provider');

function getProvider() {
  const name = (process.env.MAIL_PROVIDER || 'devConsole').toLowerCase();
  if (name === 'smtp' || name === 'gmail') return smtpProvider;
  return devProvider;
}

async function sendVerifyEmail({ to, link }) {
  const subject = 'Verify your email';
  const text = `Click the link to verify your email: ${link}`;
  const html = `<p>Click the link to verify your email:</p><p><a href="${link}">${link}</a></p>`;
  return getProvider().send({ to, subject, html, text });
}

async function sendPasswordResetEmail({ to, link }) {
  const subject = 'Reset your password';
  const text = `Use this link to reset your password: ${link}`;
  const html = `<p>Use this link to reset your password:</p><p><a href="${link}">${link}</a></p>`;
  return getProvider().send({ to, subject, html, text });
}

module.exports = { sendVerifyEmail, sendPasswordResetEmail };
