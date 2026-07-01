import express from 'express';
import {
  acceptDonation,
  createDonation,
  listDonations,
  schedulePickup,
  updateDonationStatus
} from '../controllers/donationController.js';
import { authenticate } from '../middleware/auth.js';

export const donationRoutes = express.Router();

donationRoutes.use(authenticate);
donationRoutes.get('/', listDonations);
donationRoutes.post('/', createDonation);
donationRoutes.patch('/:id/accept', acceptDonation);
donationRoutes.post('/:id/pickups', schedulePickup);
donationRoutes.patch('/:id/status', updateDonationStatus);
