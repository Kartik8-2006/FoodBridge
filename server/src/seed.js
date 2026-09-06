import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { Donation } from './models/Donation.js';
import { Notification } from './models/Notification.js';
import { PickupSchedule } from './models/PickupSchedule.js';
import { SupportRequest } from './models/SupportRequest.js';
import { User } from './models/User.js';
import { DEMO_PASSWORD, demoDonations, demoUsers } from './data/demoData.js';

dotenv.config();

const passwordHash = await User.hashPassword(DEMO_PASSWORD);

async function run() {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Donation.deleteMany({}),
    Notification.deleteMany({}),
    PickupSchedule.deleteMany({}),
    SupportRequest.deleteMany({})
  ]);

  const users = await User.insertMany(
    demoUsers.map((user) => ({ ...user, passwordHash }))
  );

  const donor = users.find((user) => user.role === 'donor');
  await Donation.insertMany(demoDonations(donor._id));

  console.log(`Seed data created. Password for all users: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
