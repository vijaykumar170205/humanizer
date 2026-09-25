import { Router } from 'express';
import {
  getSystemStats,
  getUsers,
  updateUser,
  deleteUser,
  getSystemHealth,
  getFeedbackList,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

// Protect all admin endpoints - requires 'admin' role
router.use(protect, authorize('admin'));

router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/system-health', getSystemHealth);
router.get('/feedback', getFeedbackList);

export default router;
