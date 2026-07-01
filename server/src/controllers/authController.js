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

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${clientUrl()}/reset-password?token=${token}`;
    const mail = await sendMail({
      to: user.email,
      subject: 'Reset your FoodBridge password',
      text: `Hi ${user.name},\n\nUse this link to reset your FoodBridge password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>Hi ${user.name},</p><p>Use this link to reset your FoodBridge password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`
    });

    if (!mail.sent) {
      return res.json({ message: 'Reset link was created, but email is not configured. Add SMTP settings in server/.env.' });
    }
  }

  res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
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
    html: `<p>Hi ${user.name},</p><p>Your FoodBridge password was changed successfully.</p>`
  });

  res.json({ message: 'Password reset successful. You can now log in.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
