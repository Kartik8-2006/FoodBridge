import express from 'express';
import {
  acceptDonation,
  createDonation,
  listDonations,
  schedulePickup,
  updateDonationStatus,
  updateDonationTracking,
  acceptVolunteerAssignment,
  claimVolunteerDonation
} from '../controllers/donationController.js';
import { authenticate } from '../middleware/auth.js';

export const donationRoutes = express.Router();

donationRoutes.use(authenticate);
donationRoutes.get('/', listDonations);
donationRoutes.post('/', createDonation);
donationRoutes.patch('/:id/accept', acceptDonation);
donationRoutes.post('/:id/pickups', schedulePickup);
donationRoutes.patch('/:id/volunteer-accept', acceptVolunteerAssignment);
donationRoutes.patch('/:id/volunteer-claim', claimVolunteerDonation);
donationRoutes.patch('/:id/tracking', updateDonationTracking);
donationRoutes.patch('/:id/status', updateDonationStatus);
