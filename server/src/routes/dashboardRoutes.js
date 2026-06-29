import express from 'express';
import { dashboard, roleDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

export const dashboardRoutes = express.Router();

dashboardRoutes.get('/', authenticate, dashboard);
dashboardRoutes.get('/:role', authenticate, roleDashboard);
