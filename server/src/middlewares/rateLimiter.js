import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Standard API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in a few minutes.',
  },
});

/**
 * Strict rate limiter for Authentication endpoints (prevent brute-force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for AI transformation and generation endpoints
 */
export const aiRewriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 rewrites per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You are submitting rewrite requests too quickly. Please wait a moment.',
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 file uploads per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'File upload rate limit reached. Please wait a few minutes before uploading more documents.',
  },
});
