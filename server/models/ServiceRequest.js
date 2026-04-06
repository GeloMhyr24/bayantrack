import mongoose from 'mongoose';

const ServiceRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: {
      type: String,
      required: true,
    },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-review', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    referenceNo: { type: String, required: true, unique: true },
    history: [
      {
        status: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model('ServiceRequest', ServiceRequestSchema);
