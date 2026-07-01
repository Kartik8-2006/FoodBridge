import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['donation', 'pickup', 'verification', 'system'],
      default: 'system'
    },
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    link: String,
    distanceKm: Number,
    distanceLabel: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    readAt: Date
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
