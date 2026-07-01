import validator from 'validator';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendMail } from '../utils/mail.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { firstName = '', lastName = '', phone = '', email } = req.body;

  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('A valid email is required');
  }

  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email: email.toLowerCase() },
    { firstName, lastName, phone, email: email.toLowerCase(), subscribedAt: new Date() },
    { new: true, upsert: true, runValidators: true }
  );

  const mail = await sendMail({
    to: subscriber.email,
    subject: 'You are subscribed to FoodBridge updates',
    text: `Hi ${subscriber.firstName || 'there'},\n\nThanks for subscribing to FoodBridge Network updates. We will send donation, volunteer, and food support news to this email.`,
    html: `<p>Hi ${subscriber.firstName || 'there'},</p><p>Thanks for subscribing to FoodBridge Network updates. We will send donation, volunteer, and food support news to this email.</p>`
  });

  res.status(201).json({
    message: mail.sent
      ? 'Subscribed successfully. Please check your email.'
      : 'Subscribed successfully, but email is not configured. Add SMTP settings in server/.env.'
  });
});
