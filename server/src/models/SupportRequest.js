import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    householdSize: { type: Number, required: true, min: 1 },
    location: { type: String, required: true },
    need: { type: String, required: true },
    urgency: { type: String, enum: ['today', 'this_week', 'ongoing'], default: 'this_week' },
    status: { type: String, enum: ['open', 'matched', 'closed'], default: 'open' }
  },
  { timestamps: true }
);

export const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);
