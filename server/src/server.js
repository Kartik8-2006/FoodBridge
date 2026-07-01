import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { connectDatabase } from './config/db.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { donationRoutes } from './routes/donationRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { newsletterRoutes } from './routes/newsletterRoutes.js';
import { supportRoutes } from './routes/supportRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',').map((value) => value.trim()) || ['http://localhost:5173', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250 }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'FoodBridge API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/support-requests', supportRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(port, () => console.log(`FoodBridge API running on port ${port}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
