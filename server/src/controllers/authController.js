import crypto from 'crypto';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendMail } from '../utils/mail.js';
import { signToken } from '../utils/token.js';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile
  };
}

function clientUrl() {
  const urls = (process.env.CLIENT_URL || 'http://localhost:5175').split(',').map((value) => value.trim()).filter(Boolean);
  return urls.find((url) => url.includes('localhost:5175')) || urls[0] || 'http://localhost:5175';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, profile = {} } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const verificationStatus = role === 'ngo' ? 'pending' : 'not_required';
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    profile: { ...profile, verificationStatus }
  });

  await Notification.create({
    user: user._id,
    title: 'Welcome to FoodBridge Network',
    message: role === 'ngo'
      ? 'Your NGO profile has been submitted for verification.'
      : 'Your account is ready. You can now use your FoodBridge dashboard.',
    type: role === 'ngo' ? 'verification' : 'system'
  });

  res.status(201).json({ user: publicUser(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  const passwordMatch = user ? await user.comparePassword(password) : false;
  if (!user || !passwordMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ user: publicUser(user), token: signToken(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (typeof email !== 'string' || !email.trim()) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${clientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const safeName = escapeHtml(user.name);
    const mail = await sendMail({
      to: user.email,
      subject: 'Reset your FoodBridge password',
      text: `Hi ${user.name},\n\nWe received a request to reset your FoodBridge Network password. Open this secure link within 60 minutes:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email. Your current password will continue to work.`,
      html: `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;color:#252525;line-height:1.6"><div style="padding:22px;background:#78be21;color:#fff"><strong style="font-size:22px">FoodBridge Network</strong></div><div style="padding:28px;border:1px solid #e5e7eb;border-top:0"><h1 style="font-size:24px;margin-top:0">Reset your password</h1><p>Hi ${safeName},</p><p>We received a request to reset your FoodBridge Network password.</p><p style="margin:28px 0"><a href="${resetUrl}" style="background:#c02b0a;color:#fff;padding:13px 22px;text-decoration:none;font-weight:bold">Reset password</a></p><p>This secure link expires in 60 minutes and can be used once.</p><p style="color:#75787b;font-size:14px">If you did not request this, ignore this email. Your current password will continue to work.</p></div></div>`
    });

    if (!mail.sent) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      res.status(503);
      throw new Error('We could not send the reset email right now. Please try again shortly.');
    }
  }

  res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
    res.status(400);
    throw new Error('Reset token and new password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or expired');
  }

  user.passwordHash = await User.hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Your FoodBridge password was changed',
    text: `Hi ${user.name},\n\nYour FoodBridge password was changed successfully.`,
    html: `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;color:#252525;line-height:1.6"><h2>Password changed</h2><p>Hi ${escapeHtml(user.name)},</p><p>Your FoodBridge Network password was changed successfully.</p><p>If you did not make this change, contact FoodBridge support immediately.</p></div>`
  });

  res.json({ message: 'Password reset successful. You can now log in.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
