import mongoose from 'mongoose';
import validator from 'validator';

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
    subscribedAt: { type: Date, default: Date.now },
    lastConfirmationSentAt: Date
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
