import { Donation } from '../models/Donation.js';
import { Notification } from '../models/Notification.js';
import { PickupSchedule } from '../models/PickupSchedule.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDonations = asyncHandler(async (req, res) => {
  const { status, city, mine } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (city) filter.city = new RegExp(city, 'i');
  if (mine === 'true' && req.user.role === 'donor') filter.donor = req.user._id;
  if (!status && ['ngo', 'volunteer', 'recipient'].includes(req.user.role)) {
    filter.status = { $in: ['posted', 'accepted', 'pickup_scheduled'] };
  }

  const donations = await Donation.find(filter)
    .populate('donor', 'name email profile')
    .populate('acceptedBy', 'name role')
    .populate('assignedVolunteer', 'name role')
    .sort({ createdAt: -1 });

  res.json({ donations });
});

export const createDonation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only donors can post food donations');
  }

  const donation = await Donation.create({
    ...req.body,
    donor: req.user._id
  });

  const nearbyOperators = await User.find({ role: { $in: ['ngo', 'volunteer'] }, isActive: true });
  await Notification.insertMany(
    nearbyOperators.map((user) => ({
      user: user._id,
      title: 'New food donation available',
      message: `${donation.title} is available in ${donation.city}.`,
      type: 'donation'
    }))
  );

  res.status(201).json({ donation });
});

export const acceptDonation = asyncHandler(async (req, res) => {
  if (!['ngo', 'volunteer', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Only NGOs, volunteers, or admins can accept donations');
  }

  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    res.status(404);
    throw new Error('Donation not found');
  }

  if (donation.status !== 'posted') {
    res.status(409);
    throw new Error('Donation is no longer available');
  }

  donation.status = 'accepted';
  donation.acceptedBy = req.user._id;
  if (req.user.role === 'volunteer') {
    donation.assignedVolunteer = req.user._id;
  }
  await donation.save();

  await Notification.create({
    user: donation.donor,
    title: 'Donation accepted',
    message: `${donation.title} has been accepted for pickup coordination.`,
    type: 'donation'
  });

  res.json({ donation });
});

export const schedulePickup = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    res.status(404);
    throw new Error('Donation not found');
  }

  if (!donation.acceptedBy?.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the accepting NGO, volunteer, or admin can schedule this pickup');
  }

  const pickup = await PickupSchedule.create({
    donation: donation._id,
    acceptedBy: donation.acceptedBy || req.user._id,
    assignedVolunteer: req.body.assignedVolunteer,
    scheduledAt: req.body.scheduledAt,
    deliveryLocation: req.body.deliveryLocation,
    notes: req.body.notes
  });

  donation.status = 'pickup_scheduled';
  donation.assignedVolunteer = req.body.assignedVolunteer;
  await donation.save();

  res.status(201).json({ pickup, donation });
});

export const updateDonationStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ['picked_up', 'delivered', 'cancelled', 'expired'];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid donation status');
  }

  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    res.status(404);
    throw new Error('Donation not found');
  }

  const canUpdate =
    req.user.role === 'admin' ||
    donation.donor.equals(req.user._id) ||
    donation.acceptedBy?.equals(req.user._id) ||
    donation.assignedVolunteer?.equals(req.user._id);

  if (!canUpdate) {
    res.status(403);
    throw new Error('You cannot update this donation');
  }

  donation.status = status;
  if (req.body.distributionTarget) donation.distributionTarget = req.body.distributionTarget;
  if (req.body.beneficiaryCount !== undefined) donation.beneficiaryCount = req.body.beneficiaryCount;
  if (status === 'delivered') donation.deliveredAt = new Date();
  await donation.save();

  await PickupSchedule.findOneAndUpdate(
    { donation: donation._id },
    { status: status === 'delivered' ? 'delivered' : status === 'picked_up' ? 'picked_up' : 'cancelled' }
  );

  res.json({ donation });
});
