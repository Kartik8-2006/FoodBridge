import { Donation } from '../models/Donation.js';
import { Notification } from '../models/Notification.js';
import { PickupSchedule } from '../models/PickupSchedule.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDistanceToDonation, cityRegex, sortUsersByDistance } from '../utils/distance.js';

function normalizeLocation(value, label) {
  if (!value) return undefined;

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;

  return {
    latitude,
    longitude,
    ...(value.accuracy !== undefined && Number.isFinite(Number(value.accuracy)) ? { accuracy: Number(value.accuracy) } : {}),
    label: value.label || label
  };
}

export const listDonations = asyncHandler(async (req, res) => {
  const { status, city, mine } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (city) filter.city = new RegExp(city, 'i');
  if (mine === 'true' && req.user.role === 'donor') filter.donor = req.user._id;
  if (!status && ['ngo', 'volunteer', 'recipient'].includes(req.user.role)) {
    filter.status = { $in: ['posted', 'accepted', 'pickup_scheduled'] };
  }
  if (!city && ['ngo', 'volunteer'].includes(req.user.role)) {
    const userCity = req.user.profile?.city || req.user.profile?.serviceArea;
    const sameCity = cityRegex(userCity);
    if (sameCity) filter.city = sameCity;
  }

  const donations = await Donation.find(filter)
    .populate('donor', 'name email profile')
    .populate('acceptedBy', 'name role')
    .populate('assignedVolunteer', 'name role')
    .sort({ createdAt: -1 });

  res.json({ donations: donations.map((donation) => addDistanceToDonation(donation, req.user)) });
});

export const createDonation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only donors can post food donations');
  }

  const {
    title,
    foodType,
    dietType,
    quantity,
    estimatedMeals,
    pickupAddress,
    pickupLocation,
    city,
    pickupWindowStart,
    pickupWindowEnd,
    safeBefore,
    storageInstructions,
    allergenNotes,
    contactNumber,
    imageUrl,
    distributionTarget
  } = req.body;

  if (!title || !foodType || !dietType || !quantity || !pickupAddress || !city || !contactNumber || !pickupWindowStart || !pickupWindowEnd || !safeBefore) {
    res.status(400);
    throw new Error('Complete all required food, pickup, and safety details');
  }

  const meals = Number(estimatedMeals);
  if (!Number.isFinite(meals) || meals < 1) {
    res.status(400);
    throw new Error('Estimated meals must be at least 1');
  }

  const pickupStart = new Date(pickupWindowStart);
  const pickupEnd = new Date(pickupWindowEnd);
  const safeUntil = new Date(safeBefore);
  if ([pickupStart, pickupEnd, safeUntil].some((date) => Number.isNaN(date.getTime()))) {
    res.status(400);
    throw new Error('Pickup and safe-before dates must be valid');
  }
  if (pickupEnd <= pickupStart) {
    res.status(400);
    throw new Error('Pickup end time must be after pickup start time');
  }
  if (safeUntil < pickupStart) {
    res.status(400);
    throw new Error('Food must remain safe through the pickup start time');
  }

  const normalizedPickupLocation = normalizeLocation(pickupLocation, pickupAddress);
  const donation = await Donation.create({
    donor: req.user._id,
    title,
    foodType,
    dietType,
    quantity,
    estimatedMeals: meals,
    pickupAddress,
    ...(normalizedPickupLocation ? { pickupLocation: normalizedPickupLocation } : {}),
    city,
    pickupWindowStart: pickupStart,
    pickupWindowEnd: pickupEnd,
    safeBefore: safeUntil,
    storageInstructions,
    allergenNotes,
    contactNumber,
    imageUrl,
    distributionTarget
  });

  const donorCity = donation.city || req.user.profile?.city;
  const sameCity = cityRegex(donorCity);
  const sameCityNgos = sameCity
    ? await User.find({ role: 'ngo', isActive: true, 'profile.city': sameCity }).limit(20)
    : [];
  const fallbackNgos = sameCityNgos.length
    ? []
    : await User.find({ role: 'ngo', isActive: true }).limit(20);
  const nearestNgos = sortUsersByDistance(sameCityNgos.length ? sameCityNgos : fallbackNgos, donorCity).slice(0, 5);

  if (nearestNgos.length) {
    await Notification.insertMany(nearestNgos.map((user) => {
      const donationWithDistance = addDistanceToDonation(donation, user);
      return {
      user: user._id,
      title: 'New food donation available',
      message: `${donation.title} is available in ${donation.city}. Donor is about ${donationWithDistance.distanceLabel} from your NGO.`,
      type: 'donation',
      donation: donation._id,
      link: '/dashboard/ngo#available-donations',
      distanceKm: donationWithDistance.distanceKm,
      distanceLabel: donationWithDistance.distanceLabel,
      metadata: {
        donorCity,
        ngoCity: user.profile?.city || user.profile?.serviceArea,
        donorName: req.user.name,
        donationTitle: donation.title
      }
    };
    }));
  }

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
    type: 'donation',
    donation: donation._id,
    link: '/dashboard/donor#track-donations'
  });

  if (req.user.role === 'ngo') {
    const sameCity = cityRegex(donation.city);
    const volunteers = await User.find({
      role: 'volunteer',
      isActive: true,
      ...(sameCity ? { 'profile.city': sameCity } : {})
    }).limit(5);

    if (volunteers.length) {
      await Notification.insertMany(volunteers.map((volunteer) => {
        const donationWithDistance = addDistanceToDonation(donation, volunteer);
        return {
          user: volunteer._id,
          title: 'Pickup task available',
          message: `${donation.title} needs pickup in ${donation.city}. Donor is about ${donationWithDistance.distanceLabel} from you.`,
          type: 'pickup',
          donation: donation._id,
          link: '/dashboard/volunteer#available-pickups',
          distanceKm: donationWithDistance.distanceKm,
          distanceLabel: donationWithDistance.distanceLabel,
          metadata: {
            donationTitle: donation.title,
            donorCity: donation.city
          }
        };
      }));
    }
  }

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
  donation.deliveryAddress = req.body.deliveryLocation;
  const deliveryLocation = normalizeLocation(req.body.deliveryCoordinates, req.body.deliveryLocation);
  if (deliveryLocation) donation.deliveryLocation = deliveryLocation;
  await donation.save();

  res.status(201).json({ pickup, donation });
});

export const updateDonationTracking = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    res.status(404);
    throw new Error('Donation not found');
  }

  const canTrack =
    req.user.role === 'admin' ||
    donation.acceptedBy?.equals(req.user._id) ||
    donation.assignedVolunteer?.equals(req.user._id);

  if (!canTrack) {
    res.status(403);
    throw new Error('You cannot update tracking for this donation');
  }

  const location = normalizeLocation(req.body.location, req.body.label || 'Volunteer location');
  if (!location) {
    res.status(400);
    throw new Error('A valid latitude and longitude are required');
  }

  donation.volunteerLocation = {
    ...location,
    updatedAt: new Date()
  };

  if (req.body.status && ['picked_up', 'delivered'].includes(req.body.status)) {
    donation.status = req.body.status;
    if (req.body.status === 'delivered') donation.deliveredAt = new Date();
  }

  await donation.save();

  res.json({ donation });
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
  const volunteerLocation = normalizeLocation(req.body.location, 'Volunteer location');
  if (volunteerLocation) donation.volunteerLocation = { ...volunteerLocation, updatedAt: new Date() };
  if (status === 'delivered') donation.deliveredAt = new Date();
  await donation.save();

  await PickupSchedule.findOneAndUpdate(
    { donation: donation._id },
    { status: status === 'delivered' ? 'delivered' : status === 'picked_up' ? 'picked_up' : 'cancelled' }
  );

  res.json({ donation });
});
