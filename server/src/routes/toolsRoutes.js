import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkGrammar,
  detectAI,
  checkPlagiarism,
  generateEssay,
} from '../controllers/toolsController.js';
import { optionalAuth } from '../middlewares/auth.js';
import { checkUsageLimit } from '../middlewares/usageLimiter.js';
import { aiRewriteLimiter } from '../middlewares/rateLimiter.js';
import { validateRequest } from '../middlewares/validator.js';

const router = Router();

// Grammar & Readability Checker
router.post(
  '/grammar/check',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('text'),
  [body('text').trim().notEmpty().withMessage('Text is required for grammar check'), validateRequest],
  checkGrammar
);

// AI Likelihood Detector
router.post(
  '/detector/analyze',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('text'),
  [body('text').trim().notEmpty().withMessage('Text is required for AI detection analysis'), validateRequest],
  detectAI
);

// Plagiarism Scanner
router.post(
  '/plagiarism/check',
  aiRewriteLimiter,
  optionalAuth,
  [body('text').trim().notEmpty().withMessage('Text is required for plagiarism scan'), validateRequest],
  checkPlagiarism
);

// Essay & Long-Form Generator
router.post(
  '/essay/generate',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('topic'),
  [body('topic').trim().notEmpty().withMessage('Topic is required for essay generation'), validateRequest],
  generateEssay
);

export default router;
