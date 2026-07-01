import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import validator from 'validator';

const profileSchema = new mongoose.Schema(
  {
    organizationName: String,
    organizationType: String,
    foodSourceType: String,
    registrationNumber: String,
    contactPerson: String,
    serviceArea: String,
    availability: String,
    hasTransport: Boolean,
    serviceRadiusKm: Number,
    householdSize: Number,
    assistanceNeed: String,
    city: String,
    address: String,
    phone: String,
    verificationStatus: {
      type: String,
      enum: ['not_required', 'pending', 'verified', 'rejected'],
      default: 'not_required'
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer', 'recipient', 'admin'],
      required: true
    },
    profile: { type: profileSchema, default: {} },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);
