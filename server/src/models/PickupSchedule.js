import mongoose from 'mongoose';

const pickupScheduleSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledAt: { type: Date, required: true },
    deliveryLocation: { type: String, required: true },
    notes: String,
    proofImageUrl: String,
    status: {
      type: String,
      enum: ['scheduled', 'picked_up', 'delivered', 'cancelled'],
      default: 'scheduled'
    }
  },
  { timestamps: true }
);

export const PickupSchedule = mongoose.model('PickupSchedule', pickupScheduleSchema);
