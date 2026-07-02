import nodemailer from 'nodemailer';

let transporter;

function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!mailConfigured()) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const activeTransporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'FoodBridge Network <no-reply@foodbridge.local>';

  if (!activeTransporter) {
    console.warn('MAIL_DISABLED', { to, subject, text });
    return { sent: false };
  }

  try {
    const info = await activeTransporter.sendMail({ from, to, subject, text, html });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('MAIL_SEND_FAILED', { to, subject, message: error.message });
    return { sent: false, error: 'Email delivery failed' };
  }
}
