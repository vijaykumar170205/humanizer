import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUsageStats,
  submitFeedback,
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/feedback', optionalAuth, submitFeedback);

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.get('/usage', protect, getUsageStats);

export default router;
