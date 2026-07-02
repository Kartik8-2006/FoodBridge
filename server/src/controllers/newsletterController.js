import validator from 'validator';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendMail } from '../utils/mail.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { firstName = '', lastName = '', phone = '', email } = req.body;

  if (typeof email !== 'string' || !validator.isEmail(email.trim())) {
    res.status(400);
    throw new Error('A valid email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email: normalizedEmail },
    {
      firstName: typeof firstName === 'string' ? firstName.trim() : '',
      lastName: typeof lastName === 'string' ? lastName.trim() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      email: normalizedEmail,
      status: 'active',
      subscribedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true }
  );

  const greeting = subscriber.firstName || 'there';
  const mail = await sendMail({
    to: subscriber.email,
    subject: 'Welcome to FoodBridge Network updates',
    text: `Hi ${greeting},\n\nThank you for subscribing to FoodBridge Network. We connect food donors with verified NGOs and volunteers so safe surplus food can reach nearby communities instead of going to waste.\n\nYou will receive updates about our rescued-food impact, donation opportunities, volunteer pickups, partner NGOs, food-safety guidance, and community stories.\n\nTogether, we can give good food a safe second life.`,
    html: `<div style="max-width:620px;margin:auto;font-family:Arial,sans-serif;color:#252525;line-height:1.65"><div style="padding:24px;background:#78be21;color:#fff"><strong style="font-size:23px">FoodBridge Network</strong><div>Rescue food. Strengthen communities.</div></div><div style="padding:30px;border:1px solid #e5e7eb;border-top:0"><h1 style="font-size:25px;margin-top:0;color:#c02b0a">You are subscribed</h1><p>Hi ${escapeHtml(greeting)},</p><p>Thank you for joining FoodBridge Network. We connect food donors with verified NGOs and volunteers so safe surplus food can reach nearby communities instead of going to waste.</p><h2 style="font-size:18px">What you will hear about</h2><ul><li>Meals and surplus food rescued through the network</li><li>Donation opportunities and food-safety guidance</li><li>Volunteer pickup needs and community events</li><li>Verified NGO partnerships and impact stories</li></ul><p><strong>Together, we can give good food a safe second life.</strong></p><p style="color:#75787b;font-size:14px">You received this email because this address subscribed on the FoodBridge website.</p></div></div>`
  });

  if (mail.sent) {
    subscriber.lastConfirmationSentAt = new Date();
    await subscriber.save();
  }

  res.status(201).json({
    message: mail.sent
      ? 'Subscribed successfully. Please check your email.'
      : 'Your subscription was saved, but the confirmation email could not be sent right now.'
  });
});
