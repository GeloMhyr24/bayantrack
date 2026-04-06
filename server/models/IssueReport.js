import mongoose from 'mongoose';

const IssueReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'in-review', 'resolved', 'rejected'],
      default: 'new',
    },
    adminChecked: { type: Boolean, default: false },
    referenceNo: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export default mongoose.model('IssueReport', IssueReportSchema);
