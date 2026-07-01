import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    foodType: {
      type: String,
      enum: ['cooked', 'raw', 'packaged', 'bakery', 'produce', 'mixed'],
      required: true
    },
    dietType: { type: String, enum: ['veg', 'non-veg', 'vegan', 'mixed'], required: true },
    quantity: { type: String, required: true },
    estimatedMeals: { type: Number, required: true, min: 1 },
    pickupAddress: { type: String, required: true },
    pickupLocation: {
      latitude: Number,
      longitude: Number,
      label: String
    },
    city: { type: String, required: true },
    pickupWindowStart: { type: Date, required: true },
    pickupWindowEnd: { type: Date, required: true },
    safeBefore: { type: Date, required: true },
    storageInstructions: String,
    allergenNotes: String,
    contactNumber: String,
    imageUrl: String,
    status: {
      type: String,
      enum: ['posted', 'accepted', 'pickup_scheduled', 'picked_up', 'delivered', 'cancelled', 'expired'],
      default: 'posted'
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryAddress: String,
    deliveryLocation: {
      latitude: Number,
      longitude: Number,
      label: String
    },
    volunteerLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      label: String,
      updatedAt: Date
    },
    distributionTarget: {
      type: String,
      enum: ['families', 'shelters', 'schools', 'old_age_homes', 'orphanages', 'community_kitchens'],
      default: 'families'
    },
    beneficiaryCount: { type: Number, default: 0 },
    deliveredAt: Date
  },
  { timestamps: true }
);

export const Donation = mongoose.model('Donation', donationSchema);
