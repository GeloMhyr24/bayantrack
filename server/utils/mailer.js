import nodemailer from 'nodemailer';

const DEFAULT_MAIL_USER = process.env.MAIL_USER || process.env.NOTIFICATION_EMAIL || 'superadminbayantrack@gmail.com';
const DEFAULT_MAIL_FROM = process.env.MAIL_FROM || `"BayanTrack" <${DEFAULT_MAIL_USER}>`;

let transporterInstance = null;

export function getNotificationEmail() {
  return process.env.NOTIFICATION_EMAIL || DEFAULT_MAIL_USER;
}

export function getMailTransporter() {
  if (transporterInstance) return transporterInstance;

  const user = process.env.MAIL_USER || DEFAULT_MAIL_USER;
  const pass = process.env.MAIL_PASS || '';
  const service = process.env.MAIL_SERVICE || 'gmail';

  if (!user || !pass) {
    return null;
  }

  transporterInstance = nodemailer.createTransport({
    service,
    auth: { user, pass },
  });
  return transporterInstance;
}

export async function safeSendMail(options = {}) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn('Mail transporter is not configured. Set MAIL_USER and MAIL_PASS in .env.');
    return false;
  }

  await transporter.sendMail({
    from: DEFAULT_MAIL_FROM,
    ...options,
  });
  return true;
}
