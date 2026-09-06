import { Donation } from './models/Donation.js';
import { User } from './models/User.js';
import { DEMO_PASSWORD, demoDonations, demoUsers } from './data/demoData.js';

// Runs once on server startup. It is NON-DESTRUCTIVE:
//  - Creates any demo user account that does not already exist (by email).
//  - Never touches an existing account or changes its password.
//  - Only inserts the sample donations when there are no donations at all.
export async function seedDemoDataIfMissing() {
  const demoEmails = demoUsers.map((user) => user.email);
  const existing = await User.find({ email: { $in: demoEmails } }).select('email').lean();
  const existingEmails = new Set(existing.map((user) => user.email));

  const missing = demoUsers.filter((user) => !existingEmails.has(user.email));

  if (missing.length > 0) {
    const passwordHash = await User.hashPassword(DEMO_PASSWORD);
    const created = await User.insertMany(
      missing.map((user) => ({ ...user, passwordHash }))
    );
    console.log(`Auto-seed: created ${created.length} demo user(s): ${created.map((u) => u.email).join(', ')}`);
  } else {
    console.log('Auto-seed: all demo users already exist, nothing to create.');
  }

  const donationCount = await Donation.countDocuments();
  if (donationCount === 0) {
    const donor = await User.findOne({ email: 'donor@foodbridge.org' });
    if (donor) {
      await Donation.insertMany(demoDonations(donor._id));
      console.log('Auto-seed: created 3 demo donations for the demo donor.');
    } else {
      console.log('Auto-seed: demo donor not found, skipping demo donations.');
    }
  } else {
    console.log(`Auto-seed: demo donations skipped (${donationCount} donation(s) already exist).`);
  }
}