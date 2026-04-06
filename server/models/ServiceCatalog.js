import mongoose from 'mongoose';

const ServiceCatalogSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    desc: { type: String, default: '' },
    usage: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    time: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

export default mongoose.model('ServiceCatalog', ServiceCatalogSchema);
