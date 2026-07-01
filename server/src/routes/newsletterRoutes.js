import express from 'express';
import { subscribeNewsletter } from '../controllers/newsletterController.js';

export const newsletterRoutes = express.Router();

newsletterRoutes.post('/subscribe', subscribeNewsletter);
