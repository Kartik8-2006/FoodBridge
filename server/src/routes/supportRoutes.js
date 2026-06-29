import express from 'express';
import { createSupportRequest } from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';

export const supportRoutes = express.Router();

supportRoutes.post('/', authenticate, createSupportRequest);
