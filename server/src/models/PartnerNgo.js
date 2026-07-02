import mongoose from 'mongoose';

const partnerNgoSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    serviceArea: { type: String, required: true, trim: true },
    focusAreas: [{ type: String, trim: true }],
    partnerSince: { type: Number, required: true },
    weeklyCapacity: { type: Number, required: true, min: 1 },
    logo: {
      initials: { type: String, required: true },
      primaryColor: { type: String, required: true },
      accentColor: { type: String, required: true }
    },
    verified: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const PartnerNgo = mongoose.model('PartnerNgo', partnerNgoSchema);
