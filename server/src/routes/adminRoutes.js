import express from 'express';
import { verifyNgo, verifyUser } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const adminRoutes = express.Router();

adminRoutes.use(authenticate, authorize('admin'));
adminRoutes.patch('/ngos/:id/verification', verifyNgo);
adminRoutes.patch('/users/:id/verification', verifyUser);
