import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
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
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ user: publicUser(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
