import mongoose from 'mongoose';

const SystemSettingSchema = new mongoose.Schema(
  {
    autoArchiveReports: { type: Boolean, default: true },
    requireAnnouncementReview: { type: Boolean, default: false },
    emailDigest: { type: Boolean, default: true },
    allowResidentRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    lockoutWindowMinutes: { type: Number, default: 15 },
  },
  { timestamps: true },
);

export default mongoose.model('SystemSetting', SystemSettingSchema);
