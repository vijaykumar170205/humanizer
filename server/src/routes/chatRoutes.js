import { Router } from 'express';
import { handleChat, getChatStatus } from '../controllers/chatController.js';

const router = Router();

// Primary Chat Endpoint: POST /api/chat
router.post('/', handleChat);

// Message Alias: POST /api/chat/message
router.post('/message', handleChat);

// Status check: GET /api/chat/status
router.get('/status', getChatStatus);

export default router;
