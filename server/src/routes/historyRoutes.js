import { Router } from 'express';
import {
  getHistory,
  getHistoryById,
  toggleFavorite,
  deleteHistory,
  clearHistory,
} from '../controllers/historyController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.use(protect); // All history routes require authentication

router.get('/', getHistory);
router.get('/:id', getHistoryById);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteHistory);
router.delete('/', clearHistory);

export default router;
