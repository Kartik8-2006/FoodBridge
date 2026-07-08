import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendMessage, getMessages, getChatContacts } from '../controllers/messageController.js';

export const messageRoutes = express.Router();

messageRoutes.use(authenticate);

messageRoutes.post('/', sendMessage);
messageRoutes.get('/contacts', getChatContacts);
messageRoutes.get('/thread/:contactId', getMessages);
