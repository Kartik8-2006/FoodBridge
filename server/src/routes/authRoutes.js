import express from 'express';
import { forgotPassword, login, me, register, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export const authRoutes = express.Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/forgot-password', forgotPassword);
authRoutes.post('/reset-password', resetPassword);
authRoutes.get('/me', authenticate, me);
