import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';

export const notificationRoutes = express.Router();

notificationRoutes.use(authenticate);
notificationRoutes.get('/', listNotifications);
notificationRoutes.patch('/read-all', markAllNotificationsRead);
notificationRoutes.patch('/:id/read', markNotificationRead);
