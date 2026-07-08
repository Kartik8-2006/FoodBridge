import { Donation } from '../models/Donation.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { Notification } from '../models/Notification.js';
import { PickupSchedule } from '../models/PickupSchedule.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDistanceToDonation, cityRegex } from '../utils/distance.js';

function getDonationKg(donation) {
  const quantity = String(donation?.quantity || '');
  const number = Number(quantity.match(/\d+(\.\d+)?/)?.[0] || 0);
  if (!number) return 0;
  if (/meal|pack|serving|pax|unit|box|tray|pan/i.test(quantity)) return Math.round(number * 0.45);
  return number;
}

function hoursBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) return null;
  return (endDate - startDate) / (60 * 60 * 1000);
}

function averageDeliveryTimeLabel(donations) {
  const durations = donations
    .map((item) => hoursBetween(item.pickupWindowStart || item.createdAt, item.deliveredAt || item.updatedAt))
    .filter((value) => Number.isFinite(value));
  if (!durations.length) return 'Pending';
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return `${average.toFixed(1)} hrs`;
}

function buildMonthlySeries(donations, field = 'kg') {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const items = donations.filter((donation) => {
      const sourceDate = new Date(donation.deliveredAt || donation.updatedAt || donation.createdAt);
      return sourceDate.getMonth() === month && sourceDate.getFullYear() === year;
    });
    const value = items.reduce((sum, item) => sum + (field === 'meals' ? Number(item.estimatedMeals || 0) : getDonationKg(item)), 0);
    return {
      label: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      value
    };
  });
}

export const dashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  const data = {};

  if (role === 'donor') {
    const allDonations = await Donation.find({ donor: userId })
      .populate('donor', 'name email profile')
      .populate('acceptedBy', 'name role profile')
      .populate('assignedVolunteer', 'name role profile')
      .sort({ createdAt: -1 });
    const donations = allDonations.slice(0, 20);
    const deliveredDonations = allDonations.filter((item) => item.status === 'delivered');
    const activeDonations = allDonations.filter((item) => ['posted', 'accepted', 'pickup_scheduled', 'picked_up'].includes(item.status));
    const totalMeals = allDonations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);
    const foodSavedKg = allDonations.reduce((sum, item) => sum + getDonationKg(item), 0);
    data.stats = {
      totalDonations: allDonations.length,
      mealsContributed: totalMeals,
      foodSavedKg,
      peopleImpacted: deliveredDonations.reduce((sum, item) => sum + Number(item.beneficiaryCount || item.estimatedMeals || 0), 0),
      activeDonations: activeDonations.length,
      pendingPickups: activeDonations.length,
      completed: deliveredDonations.length,
      ngosHelped: new Set(allDonations.map((item) => String(item.acceptedBy?._id || item.acceptedBy || '')).filter(Boolean)).size,
      volunteersAssigned: allDonations.filter((item) => item.assignedVolunteer).length,
      averagePickupTime: averageDeliveryTimeLabel(deliveredDonations)
    };
    data.donations = donations;
  }

  if (role === 'ngo') {
    const acceptedDonations = await Donation.find({ acceptedBy: userId }).sort({ updatedAt: -1 });
    const deliveredDonations = acceptedDonations.filter((item) => item.status === 'delivered');
    const totalMealsDistributed = deliveredDonations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);
    const totalFoodKg = deliveredDonations.reduce((sum, item) => sum + getDonationKg(item), 0);
    const totalBeneficiaries = deliveredDonations.reduce((sum, item) => sum + Number(item.beneficiaryCount || item.estimatedMeals || 0), 0);
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
    data.foodRequests = await SupportRequest.find({ status: 'open' }).populate('requester', 'name email profile').sort({ createdAt: -1 }).limit(8);
    data.volunteers = await User.find({ role: 'volunteer', isActive: true }).select('-passwordHash').sort({ name: 1 }).limit(25);
    data.reports = {
      mealsDistributed: totalMealsDistributed,
      foodReceived: totalFoodKg,
      averageDeliveryTime: averageDeliveryTimeLabel(deliveredDonations),
      monthlyAnalytics: acceptedDonations.length,
      beneficiaryTargets: targetCounts,
      livesTouched: totalBeneficiaries,
      targetEfficiency: acceptedDonations.length ? Math.round((deliveredDonations.length / acceptedDonations.length) * 100) : 0,
      foodTrend: buildMonthlySeries(deliveredDonations, 'kg'),
      beneficiaryRegions: Object.entries(targetCounts).map(([target, count]) => ({
        district: target.replace(/_/g, ' '),
        peopleFed: deliveredDonations
          .filter((item) => (item.distributionTarget || 'families') === target)
          .reduce((sum, item) => sum + Number(item.beneficiaryCount || item.estimatedMeals || 0), 0),
        growth: '0%',
        status: count ? 'ACTIVE' : 'PENDING'
      })),
      wasteReductionPercent: totalFoodKg ? Math.min(100, Math.round((totalFoodKg / (totalFoodKg + 1)) * 100)) : 0,
      directSaveKg: totalFoodKg,
      optimizedKg: acceptedDonations.filter((item) => item.status !== 'delivered').reduce((sum, item) => sum + getDonationKg(item), 0),
      milestoneGoal: Number(req.user.profile?.monthlyGoalKg || 0),
      milestoneProgress: req.user.profile?.monthlyGoalKg ? Math.round((totalFoodKg / Number(req.user.profile.monthlyGoalKg)) * 100) : 0,
      milestoneMessage: totalFoodKg ? `${Math.round(totalFoodKg).toLocaleString()} kg of verified food rescued.` : ''
    };
  }

  if (role === 'volunteer') {
    const volunteerTasks = await Donation.find({ assignedVolunteer: userId })
      .populate('donor', 'name email profile')
      .populate('acceptedBy', 'name role profile')
      .populate('assignedVolunteer', 'name role profile')
      .sort({ safeBefore: 1 })
      .limit(12);
    const assignedDeliveries = volunteerTasks.filter((item) => String(item.assignedVolunteer) === String(userId));
    const completedDeliveries = assignedDeliveries.filter((item) => item.status === 'delivered');
    const completedKg = completedDeliveries.reduce((sum, item) => sum + getDonationKg(item), 0);
    const weeklyKg = completedDeliveries
      .filter((item) => new Date(item.deliveredAt || item.updatedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, item) => sum + getDonationKg(item), 0);
    const monthlyKg = completedDeliveries
      .filter((item) => new Date(item.deliveredAt || item.updatedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, item) => sum + getDonationKg(item), 0);
    const monthlyGoalKg = Number(req.user.profile?.monthlyGoalKg || 0);

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
      rating: req.user.profile?.rating || (completedDeliveries.length ? 'Unrated' : 'New'),
      hoursWorked: completedDeliveries.length * 2,
      impact: completedDeliveries.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0),
      points: completedDeliveries.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0) * 10,
      totalWeight: completedKg,
      weeklySaved: weeklyKg,
      monthlySaved: monthlyKg,
      monthlyGoalKg,
      monthlyGoalProgress: monthlyGoalKg ? Math.min(100, Math.round((monthlyKg / monthlyGoalKg) * 100)) : 0,
      monthlyGoalRemaining: monthlyGoalKg ? Math.max(0, monthlyGoalKg - monthlyKg) : 0,
      averageDeliveryTime: averageDeliveryTimeLabel(completedDeliveries),
      activeStreakDays: 0,
      rankLabel: completedDeliveries.length ? 'Active volunteer' : 'New volunteer'
    };
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
