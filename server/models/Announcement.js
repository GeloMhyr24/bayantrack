import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    module: {
      type: String,
      enum: [
        'all-news-updates',
        'barangay-updates',
        'emergency-hotlines',
        'phivolcs-alerts',
        'fact-check',
      ],
      required: true,
    },
    category: { type: String, default: 'Advisory' },
    source: { type: String, default: 'Barangay Office' },
    image: { type: String, default: '' },
    archived: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model('Announcement', AnnouncementSchema);
