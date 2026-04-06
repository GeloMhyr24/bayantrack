import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { getNotificationEmail, safeSendMail } from './mailer.js';

function isOtpOrRecoveryMail(subject = '') {
  const normalized = String(subject || '').toLowerCase();
  return (
    normalized.includes('otp') ||
    normalized.includes('password reset') ||
    normalized.includes('confirm email change') ||
    normalized.includes('confirm password change') ||
    normalized.includes('confirm child access request') ||
    normalized.includes('confirm child profile update')
  );
}

function buildSystemEventHtml({ title, type, referenceNo, metadata }) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#0f172a;color:#ffffff;padding:18px 20px;">
        <h2 style="margin:0;font-size:20px;">BayanTrack System Update</h2>
        <p style="margin:6px 0 0;font-size:12px;opacity:0.9;">Realtime admin notification</p>
      </div>
      <div style="padding:20px;color:#0f172a;">
        <p style="margin:0 0 12px;font-weight:700;">${title}</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
          <p style="margin:0 0 8px;"><strong>Type:</strong> ${type || 'system'}</p>
          <p style="margin:0 0 8px;"><strong>Reference:</strong> ${referenceNo || 'N/A'}</p>
          <p style="margin:0;"><strong>Module:</strong> ${metadata?.module || 'general'}</p>
        </div>
      </div>
    </div>
  </div>`;
}

export async function logSystemEvent({
  user,
  type,
  title,
  referenceNo = '',
  metadata = {},
  notifySuperadmin = true,
}) {
  let created = null;
  if (user) {
    created = await ActivityLog.create({
      user,
      type,
      title,
      referenceNo,
      metadata,
    });
  }

  void notifySuperadmin;
  void buildSystemEventHtml;

  return created;
}

export async function sendUserMail(options) {
  try {
    if (!isOtpOrRecoveryMail(options?.subject)) {
      return true;
    }
    return await safeSendMail(options);
  } catch (err) {
    console.error('Failed to send user email:', err);
    return false;
  }
}

export async function getAdminNotificationRecipients() {
  const users = await User.find({
    role: { $in: ['admin', 'superadmin'] },
    status: 'active',
    email: { $exists: true, $ne: '' },
  }).select('email');

  const emails = Array.from(new Set([
    getNotificationEmail(),
    ...users.map((item) => String(item.email || '').trim()).filter(Boolean),
  ]));

  return emails;
}
