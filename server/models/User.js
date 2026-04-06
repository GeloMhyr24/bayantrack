import mongoose from 'mongoose';

const PermissionFlagSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: true },
    add: { type: Boolean, default: true },
    edit: { type: Boolean, default: true },
    archive: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
  },
  { _id: false },
);

const AdminPermissionSchema = new mongoose.Schema(
  {
    officials: { type: PermissionFlagSchema, default: () => ({}) },
    announcements: { type: PermissionFlagSchema, default: () => ({}) },
    reports: { type: PermissionFlagSchema, default: () => ({}) },
    serviceRequests: { type: PermissionFlagSchema, default: () => ({}) },
    messages: { type: PermissionFlagSchema, default: () => ({}) },
    subscribers: { type: PermissionFlagSchema, default: () => ({}) },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    firstName: {
      type: String,
      required: true
    },
    middleName: {
      type: String
    },
    lastName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    addressDetails: {
      blk: { type: String, default: '' },
      lot: { type: String, default: '' },
      street: { type: String, default: '' },
      subdivision: { type: String, default: '' },
      barangay: { type: String, default: 'Mambog II' },
      city: { type: String, default: 'Bacoor City' },
      province: { type: String, default: 'Cavite' },
      zipCode: { type: String, default: '4102' },
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'prefer-not-to-say'],
      default: 'prefer-not-to-say',
    },
    civilStatus: {
      type: String,
      enum: ['single', 'married', 'widowed', 'separated'],
      default: 'single',
    },
    marriageContractImage: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['resident', 'admin', 'superadmin'],
      default: 'resident'
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending'
    },
    validIdType: {
      type: String,
      enum: ['barangay-id', 'voters-id', 'other'],
      default: 'other'
    },
    validIdImage: {
      type: String,
      default: ''
    },
    avatarImage: {
      type: String,
      default: ''
    },
    preferredContactMethod: {
      type: String,
      enum: ['Email'],
      default: 'Email',
    },
    residentNote: {
      type: String,
      default: '',
    },
    children: {
      type: [
        new mongoose.Schema(
          {
            fullName: { type: String, required: true },
            email: { type: String, default: '' },
            birthDate: { type: String, required: true },
            relationship: { type: String, default: 'Child' },
            status: {
              type: String,
              enum: ['pending', 'approved', 'rejected'],
              default: 'pending',
            },
            reviewReason: {
              type: String,
              default: '',
            },
            reviewedAt: {
              type: Date,
              default: null,
            },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
    validIdStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    adminPermissions: {
      type: AdminPermissionSchema,
      default: () => ({}),
    },
    statusReason: {
      type: String,
      default: '',
    },
    statusReviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model('User', UserSchema);
