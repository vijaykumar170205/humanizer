import { Router } from 'express';
import { body } from 'express-validator';
import {
  rewriteText,
  paraphraseText,
  rewriteSentence,
  rewriteParagraph,
  rewriteArticle,
} from '../controllers/rewriteController.js';
import { optionalAuth } from '../middlewares/auth.js';
import { checkUsageLimit } from '../middlewares/usageLimiter.js';
import { aiRewriteLimiter } from '../middlewares/rateLimiter.js';
import { validateRequest } from '../middlewares/validator.js';

const router = Router();

const textValidation = [
  body('text').trim().notEmpty().withMessage('Text cannot be empty'),
  validateRequest,
];

// Core Humanizer rewrite endpoint
router.post(
  '/',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('text'),
  textValidation,
  rewriteText
);

// Paraphraser
router.post(
  '/paraphrase',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('text'),
  textValidation,
  paraphraseText
);

// Sentence rewriter
router.post(
  '/sentence',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('sentence'),
  [body('sentence').trim().notEmpty().withMessage('Sentence cannot be empty'), validateRequest],
  rewriteSentence
);

// Paragraph rewriter
router.post(
  '/paragraph',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('paragraph'),
  [body('paragraph').trim().notEmpty().withMessage('Paragraph cannot be empty'), validateRequest],
  rewriteParagraph
);

// Article rewriter
router.post(
  '/article',
  aiRewriteLimiter,
  optionalAuth,
  checkUsageLimit('article'),
  [body('article').trim().notEmpty().withMessage('Article text cannot be empty'), validateRequest],
  rewriteArticle
);

export default router;
