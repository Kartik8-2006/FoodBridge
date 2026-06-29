import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { Donation } from './models/Donation.js';
import { Notification } from './models/Notification.js';
import { PickupSchedule } from './models/PickupSchedule.js';
import { SupportRequest } from './models/SupportRequest.js';
import { User } from './models/User.js';

dotenv.config();

const passwordHash = await User.hashPassword('Password123!');

async function run() {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Donation.deleteMany({}),
    Notification.deleteMany({}),
    PickupSchedule.deleteMany({}),
    SupportRequest.deleteMany({})
  ]);

  const users = await User.insertMany([
    {
      name: 'Anika Sharma',
      email: 'donor@foodbridge.org',
      passwordHash,
      role: 'donor',
      profile: {
        organizationName: 'Harvest Table Events',
        foodSourceType: 'event',
        city: 'Bengaluru',
        address: 'Indiranagar, Bengaluru',
        phone: '+91 98765 43210',
        verificationStatus: 'not_required'
      }
    },
    {
      name: 'Seva Meals Foundation',
      email: 'ngo@foodbridge.org',
      passwordHash,
      role: 'ngo',
      profile: {
        registrationNumber: 'NGO-4821-KA',
        contactPerson: 'Rahul Menon',
        serviceArea: 'Bengaluru East',
        city: 'Bengaluru',
        phone: '+91 98765 43211',
        verificationStatus: 'pending'
      }
    },
    {
      name: 'Meera Iyer',
      email: 'volunteer@foodbridge.org',
      passwordHash,
      role: 'volunteer',
      profile: {
        availability: 'Weekday evenings and weekends',
        hasTransport: true,
        serviceRadiusKm: 12,
        city: 'Bengaluru',
        phone: '+91 98765 43212',
        verificationStatus: 'not_required'
      }
    },
    {
      name: 'Ravi Kumar',
      email: 'recipient@foodbridge.org',
      passwordHash,
      role: 'recipient',
      profile: {
        householdSize: 4,
        assistanceNeed: 'Weekly cooked meal support',
        city: 'Bengaluru',
        phone: '+91 98765 43213',
        verificationStatus: 'not_required'
      }
    },
    {
      name: 'FoodBridge Admin',
      email: 'admin@foodbridge.org',
      passwordHash,
      role: 'admin',
      profile: { verificationStatus: 'not_required' }
    }
  ]);

  const donor = users.find((user) => user.role === 'donor');
  const now = new Date();
  await Donation.insertMany([
    {
      donor: donor._id,
      title: 'Fresh vegetable biryani trays',
      foodType: 'cooked',
      dietType: 'veg',
      quantity: '6 hotel pans',
      estimatedMeals: 95,
      pickupAddress: 'Harvest Table Events, Indiranagar, Bengaluru',
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 60 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      storageInstructions: 'Keep covered and warm until pickup.',
      allergenNotes: 'Contains dairy and cashews.',
      status: 'posted'
    },
    {
      donor: donor._id,
      title: 'Packaged bread and fruit boxes',
      foodType: 'packaged',
      dietType: 'veg',
      quantity: '40 sealed boxes',
      estimatedMeals: 40,
      pickupAddress: 'Community Hall, Koramangala, Bengaluru',
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      storageInstructions: 'Room temperature storage is acceptable.',
      allergenNotes: 'Contains wheat.',
      status: 'posted'
    },
    {
      donor: donor._id,
      title: 'Restaurant dinner meal packs',
      foodType: 'packaged',
      dietType: 'mixed',
      quantity: '55 sealed meal packs',
      estimatedMeals: 55,
      pickupAddress: 'Restaurant ABC, MG Road, Bengaluru',
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 90 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      storageInstructions: 'Keep sealed. Pickup from rear service counter.',
      allergenNotes: 'Contains wheat and dairy.',
      contactNumber: '+91 98765 43214',
      status: 'posted'
    }
  ]);

  await SupportRequest.create({
    recipient: users.find((user) => user.role === 'recipient')._id,
    householdSize: 4,
    location: 'Bengaluru East',
    need: 'Cooked meals for family support this week',
    urgency: 'this_week'
  });

  console.log('Seed data created. Password for all users: Password123!');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
