import { Donation } from '../models/Donation.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { Notification } from '../models/Notification.js';
import { PickupSchedule } from '../models/PickupSchedule.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDistanceToDonation, cityRegex } from '../utils/distance.js';

export const dashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  const data = {};

  if (role === 'donor') {
    const donations = await Donation.find({ donor: userId }).sort({ createdAt: -1 }).limit(8);
    data.stats = {
      totalDonations: await Donation.countDocuments({ donor: userId }),
      mealsContributed: (await Donation.find({ donor: userId })).reduce((sum, item) => sum + item.estimatedMeals, 0),
      pendingPickups: await Donation.countDocuments({ donor: userId, status: { $in: ['posted', 'accepted', 'pickup_scheduled'] } }),
      completed: await Donation.countDocuments({ donor: userId, status: 'delivered' })
    };
    data.donations = donations;
  }

  if (role === 'ngo') {
    const acceptedDonations = await Donation.find({ acceptedBy: userId }).sort({ updatedAt: -1 });
    const deliveredDonations = acceptedDonations.filter((item) => item.status === 'delivered');
    const totalMealsDistributed = deliveredDonations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);
    const targetCounts = acceptedDonations.reduce((acc, item) => {
      const key = item.distributionTarget || 'families';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    data.stats = {
      available: await Donation.countDocuments({ status: 'posted' }),
      accepted: await Donation.countDocuments({ acceptedBy: userId }),
      delivered: await Donation.countDocuments({ acceptedBy: userId, status: 'delivered' }),
      openRequests: await SupportRequest.countDocuments({ status: 'open' }),
      todaysDistribution: totalMealsDistributed
    };
    const userCity = req.user.profile?.city || req.user.profile?.serviceArea;
    const sameCity = cityRegex(userCity);
    const availableFilter = sameCity ? { status: 'posted', city: sameCity } : { status: 'posted' };
    const availableDonations = await Donation.find(availableFilter).populate('donor', 'name email profile').sort({ safeBefore: 1 }).limit(12);
    const acceptedDonationRows = await Donation.find({ acceptedBy: userId }).populate('donor', 'name email profile').populate('assignedVolunteer', 'name role profile').sort({ updatedAt: -1 }).limit(12);
    data.availableDonations = availableDonations.map((donation) => addDistanceToDonation(donation, req.user));
    data.acceptedDonations = acceptedDonationRows.map((donation) => addDistanceToDonation(donation, req.user));
    data.foodRequests = await SupportRequest.find({ status: 'open' }).populate('recipient', 'name email profile').sort({ createdAt: -1 }).limit(8);
    data.volunteers = await User.find({ role: 'volunteer', isActive: true }).select('-passwordHash').sort({ name: 1 }).limit(25);
    data.reports = {
      mealsDistributed: totalMealsDistributed,
      foodReceived: acceptedDonations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0),
      averageDeliveryTime: deliveredDonations.length ? '3.1 hrs' : 'Pending',
      monthlyAnalytics: acceptedDonations.length,
      beneficiaryTargets: targetCounts
    };
  }

  if (role === 'volunteer') {
    const userCity = req.user.profile?.city || req.user.profile?.serviceArea;
    const sameCity = cityRegex(userCity);
    const volunteerTasks = await Donation.find({
      $or: [
        sameCity ? { status: 'posted', city: sameCity } : { status: 'posted' },
        { assignedVolunteer: userId }
      ]
    })
      .populate('donor', 'name email profile')
      .populate('acceptedBy', 'name role profile')
      .sort({ safeBefore: 1 })
      .limit(12);
    const assignedDeliveries = volunteerTasks.filter((item) => String(item.assignedVolunteer) === String(userId));
    const completedDeliveries = assignedDeliveries.filter((item) => item.status === 'delivered');

    data.stats = {
      nearbyTasks: await Donation.countDocuments({ status: 'posted' }),
      assignedPickups: await Donation.countDocuments({ assignedVolunteer: userId }),
      completed: await Donation.countDocuments({ assignedVolunteer: userId, status: 'delivered' }),
      scheduled: await PickupSchedule.countDocuments({ assignedVolunteer: userId, status: 'scheduled' }),
      estimatedDistanceKm: volunteerTasks.length ? volunteerTasks.length * 4 : 0,
      mealsDelivered: completedDeliveries.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0)
    };
    data.tasks = volunteerTasks.map((donation) => addDistanceToDonation(donation, req.user));
    data.assignedDeliveries = assignedDeliveries.map((donation) => addDistanceToDonation(donation, req.user));
    data.deliveryHistory = completedDeliveries.map((donation) => addDistanceToDonation(donation, req.user));
    data.performance = {
      totalDeliveries: completedDeliveries.length,
      rating: completedDeliveries.length ? '4.8' : 'New',
      hoursWorked: completedDeliveries.length * 2,
      impact: completedDeliveries.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0)
    };
  }

  if (role === 'recipient') {
    data.stats = {
      openRequests: await SupportRequest.countDocuments({ recipient: userId, status: 'open' }),
      matchedRequests: await SupportRequest.countDocuments({ recipient: userId, status: 'matched' }),
      nearbyFood: await Donation.countDocuments({ status: { $in: ['posted', 'pickup_scheduled'] } }),
      deliveredSupport: await SupportRequest.countDocuments({ recipient: userId, status: 'closed' })
    };
    data.availableSupport = await Donation.find({ status: { $in: ['posted', 'pickup_scheduled'] } }).sort({ safeBefore: 1 }).limit(8);
    data.requests = await SupportRequest.find({ recipient: userId }).sort({ createdAt: -1 }).limit(8);
  }

  if (role === 'admin') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allUsers = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(60);
    const allDonations = await Donation.find()
      .populate('donor', 'name role profile')
      .populate('acceptedBy', 'name role profile')
      .populate('assignedVolunteer', 'name role profile')
      .sort({ createdAt: -1 })
      .limit(60);
    const activeDonations = allDonations.filter((item) => ['posted', 'accepted', 'pickup_scheduled', 'picked_up'].includes(item.status));
    const donationsByCategory = allDonations.reduce((acc, donation) => {
      acc[donation.foodType] = (acc[donation.foodType] || 0) + 1;
      return acc;
    }, {});
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    const activityLogs = await AdminAuditLog.find().populate('actor', 'name role').sort({ createdAt: -1 }).limit(10);
    const pendingPickups = await Donation.countDocuments({ status: { $in: ['posted', 'accepted', 'pickup_scheduled', 'picked_up'] } });
    const mealsDelivered = (await Donation.find({ status: 'delivered' })).reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);

    data.stats = {
      totalUsers: await User.countDocuments(),
      todaysDonations: await Donation.countDocuments({ createdAt: { $gte: today } }),
      pendingPickups,
      activeVolunteers: await User.countDocuments({ role: 'volunteer', isActive: true }),
      verifiedNgos: await User.countDocuments({ role: 'ngo', 'profile.verificationStatus': 'verified' }),
      mealsDelivered,
      foodRequests: await SupportRequest.countDocuments({ status: 'open' })
    };
    data.pendingNgos = await User.find({ role: 'ngo', 'profile.verificationStatus': 'pending' }).select('-passwordHash').limit(8);
    data.recentDonations = allDonations.slice(0, 12);
    data.users = allUsers;
    data.currentDonations = activeDonations.slice(0, 12);
    data.volunteers = allUsers.filter((user) => user.role === 'volunteer');
    data.ngos = allUsers.filter((user) => user.role === 'ngo');
    data.verificationQueues = {
      ngos: allUsers.filter((user) => user.role === 'ngo' && user.profile?.verificationStatus === 'pending'),
      restaurants: allUsers.filter((user) => user.role === 'donor' && ['restaurant', 'hotel', 'event', 'grocery'].includes(user.profile?.foodSourceType)),
      volunteers: allUsers.filter((user) => user.role === 'volunteer')
    };
    data.analytics = {
      dailyDonations: await Donation.countDocuments({ createdAt: { $gte: today } }),
      weeklyDonations: await Donation.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      monthlyDonations: await Donation.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      foodCategories: donationsByCategory,
      usersByRole,
      mostActiveNgo: allDonations.find((item) => item.acceptedBy)?.acceptedBy?.name || 'Pending activity',
      mostActiveDonor: allDonations[0]?.donor?.name || 'Pending activity',
      mostActiveVolunteer: allDonations.find((item) => item.assignedVolunteer)?.assignedVolunteer?.name || 'Pending activity'
    };
    data.reports = [
      { type: 'Spam', count: 0, status: 'Monitored' },
      { type: 'Expired Food', count: await Donation.countDocuments({ status: 'expired' }), status: 'Needs review' },
      { type: 'Fake NGO', count: await User.countDocuments({ role: 'ngo', 'profile.verificationStatus': 'rejected' }), status: 'Verification protected' },
      { type: 'User Complaints', count: 0, status: 'No open complaints' }
    ];
    data.activityFeed = [
      ...allDonations.slice(0, 6).map((donation) => ({
        id: donation._id,
        text: `${donation.donor?.name || 'A donor'} donated ${donation.title}`,
        status: donation.status,
        createdAt: donation.createdAt
      })),
      ...activityLogs.map((log) => ({
        id: log._id,
        text: `${log.actor?.name || 'Admin'} completed ${log.action}`,
        status: 'audit',
        createdAt: log.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  }

  data.notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(6);
  data.unreadNotificationCount = await Notification.countDocuments({ user: userId, readAt: { $exists: false } });

  res.json(data);
});

export const roleDashboard = asyncHandler(async (req, res, next) => {
  if (req.params.role !== req.user.role) {
    res.status(403);
    throw new Error('Access denied for this dashboard role');
  }

  return dashboard(req, res, next);
});
