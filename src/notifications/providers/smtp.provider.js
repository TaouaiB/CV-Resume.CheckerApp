const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('SMTP config missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    // Optional hardening:
    // tls: { minVersion: 'TLSv1.2' },
  });

  return transporter;
}

async function send({ to, subject, html, text, from }) {
  const tx = getTransporter();
  const fromAddr = from || process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await tx.sendMail({ from: fromAddr, to, subject, text, html });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MAIL][SMTP] sent', info.messageId, '->', to);
  }
  return { ok: true, id: info.messageId };
}

module.exports = { send };
