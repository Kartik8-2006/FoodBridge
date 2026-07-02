import express from 'express';
import { listPartnerNgos } from '../controllers/partnerController.js';

export const partnerRoutes = express.Router();

partnerRoutes.get('/', listPartnerNgos);
