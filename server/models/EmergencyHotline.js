import mongoose from 'mongoose';

const EmergencyHotlineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    desc: { type: String, default: '', trim: true },
    when: { type: [String], default: [] },
    prepare: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('EmergencyHotline', EmergencyHotlineSchema);

