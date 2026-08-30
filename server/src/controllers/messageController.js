import { Message } from '../models/Message.js';
import { Donation } from '../models/Donation.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function findSharedDonation(userId, contactId, donationId) {
  const participantFilter = {
    $and: [
      { $or: [{ donor: userId }, { acceptedBy: userId }, { assignedVolunteer: userId }] },
      { $or: [{ donor: contactId }, { acceptedBy: contactId }, { assignedVolunteer: contactId }] }
    ]
  };

  return Donation.findOne({
    ...(donationId ? { _id: donationId } : {}),
    ...participantFilter
  });
}

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, text, donationId } = req.body;

  if (!recipientId || !text) {
    res.status(400);
    throw new Error('Recipient ID and message text are required');
  }

  const recipient = await User.findById(recipientId).select('_id name role');
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  const sharedDonation = await findSharedDonation(req.user._id, recipientId, donationId);
  if (!sharedDonation) {
    res.status(403);
    throw new Error('You can only message users connected to one of your donations');
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    donation: sharedDonation._id,
    text
  });

  const recipientRole = recipient.role;
  const senderRole = req.user.role;
  let notificationLink = '/dashboard';
  if (recipientRole === 'donor') notificationLink = '/dashboard/donor#messages';
  else if (recipientRole === 'ngo') notificationLink = '/dashboard/ngo#notifications';
  else if (recipientRole === 'volunteer') notificationLink = '/dashboard/volunteer#messages';

  await Notification.create({
    user: recipientId,
    title: `New message from ${req.user.name}`,
    message: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    type: 'system',
    donation: sharedDonation._id,
    link: notificationLink
  });

  res.status(201).json({ message });
});

// Get message history with a specific contact
export const getMessages = asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  const sharedDonation = await findSharedDonation(req.user._id, contactId);
  if (!sharedDonation) {
    res.status(403);
    throw new Error('You can only view messages for connected donation partners');
  }

  // Find ALL shared donations between these two users
  const sharedDonations = await Donation.find({
    $and: [
      { $or: [{ donor: req.user._id }, { acceptedBy: req.user._id }, { assignedVolunteer: req.user._id }] },
      { $or: [{ donor: contactId }, { acceptedBy: contactId }, { assignedVolunteer: contactId }] }
    ]
  }).select('_id');

  const donationIds = sharedDonations.map(d => d._id);

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: contactId },
      { sender: contactId, recipient: req.user._id }
    ],
    donation: { $in: donationIds }
  })
    .sort({ createdAt: 1 })
    .limit(100);

  // Mark incoming messages as read
  await Message.updateMany(
    { sender: contactId, recipient: req.user._id, readAt: { $exists: false } },
    { readAt: new Date() }
  );

  res.json({ messages, donation: sharedDonation._id });
});

// Get active chat contacts dynamically based on active or past donations
export const getChatContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  let query = {};
  if (role === 'ngo') {
    query = { acceptedBy: userId, assignedVolunteer: { $exists: true } };
  } else if (role === 'volunteer') {
    query = { assignedVolunteer: userId, acceptedBy: { $exists: true } };
  } else {
    // Other roles can chat with anyone they have shared donations with
    query = {
      $or: [
        { donor: userId },
        { acceptedBy: userId },
        { assignedVolunteer: userId }
      ]
    };
  }

  const donations = await Donation.find(query)
    .populate('donor', 'name email role profile')
    .populate('acceptedBy', 'name email role profile')
    .populate('assignedVolunteer', 'name email role profile');

  const contactsMap = new Map();

  donations.forEach((d) => {
    if (role === 'ngo') {
      if (d.assignedVolunteer) {
        contactsMap.set(String(d.assignedVolunteer._id), d.assignedVolunteer);
      }
    } else if (role === 'volunteer') {
      if (d.acceptedBy) {
        contactsMap.set(String(d.acceptedBy._id), d.acceptedBy);
      }
      if (d.donor) {
        contactsMap.set(String(d.donor._id), d.donor);
      }
    } else if (role === 'donor') {
      if (d.acceptedBy) {
        contactsMap.set(String(d.acceptedBy._id), d.acceptedBy);
      }
      if (d.assignedVolunteer) {
        contactsMap.set(String(d.assignedVolunteer._id), d.assignedVolunteer);
      }
    }
  });

  const contacts = Array.from(contactsMap.values()).map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.profile?.avatarUrl,
    phone: u.profile?.phone,
    organizationName: u.profile?.organizationName
  }));

  res.json({ contacts });
});
