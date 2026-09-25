import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rewriteRoutes from './rewriteRoutes.js';
import toolsRoutes from './toolsRoutes.js';
import fileRoutes from './fileRoutes.js';
import historyRoutes from './historyRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Humanly AI Writing Engine API',
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/rewrite', rewriteRoutes);
router.use('/tools', toolsRoutes);
router.use('/files', fileRoutes);
router.use('/history', historyRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);

export default router;
