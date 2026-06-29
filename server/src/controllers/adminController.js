import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyNgo = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Verification status must be verified or rejected');
  }

  const ngo = await User.findOne({ _id: req.params.id, role: 'ngo' });
  if (!ngo) {
    res.status(404);
    throw new Error('NGO profile not found');
  }

  ngo.profile.verificationStatus = status;
  await ngo.save();

  await AdminAuditLog.create({
    actor: req.user._id,
    action: `ngo_${status}`,
    targetType: 'User',
    targetId: ngo._id,
    details: { email: ngo.email }
  });

  await Notification.create({
    user: ngo._id,
    title: status === 'verified' ? 'NGO profile verified' : 'NGO verification update',
    message: status === 'verified'
      ? 'Your NGO account is verified and ready to coordinate donations.'
      : 'Your NGO verification was not approved. Please contact support with updated documents.',
    type: 'verification'
  });

  res.json({ user: ngo });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Verification status must be pending, verified, or rejected');
  }

  const user = await User.findById(req.params.id);
  if (!user || user.role === 'admin') {
    res.status(404);
    throw new Error('Verifiable user not found');
  }

  user.profile.verificationStatus = status;
  await user.save();

  await AdminAuditLog.create({
    actor: req.user._id,
    action: `${user.role}_${status}`,
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, role: user.role }
  });

  await Notification.create({
    user: user._id,
    title: 'Verification status updated',
    message: `Your ${user.role} verification status is now ${status}.`,
    type: 'verification'
  });

  res.json({ user });
});
