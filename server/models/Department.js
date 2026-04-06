import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    localNumber: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Department', DepartmentSchema);
