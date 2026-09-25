import User from '../models/User.js';
import Usage from '../models/Usage.js';
import Feedback from '../models/Feedback.js';
import RewriteHistory from '../models/RewriteHistory.js';
import Document from '../models/Document.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc   Get user profile & dashboard statistics
 * @route  GET /api/user/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    const totalRewrites = await RewriteHistory.countDocuments({ userId: user._id });
    const totalDocuments = await Document.countDocuments({ userId: user._id, isArchived: false });

    return successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        wordLimit: user.wordLimit,
        wordsUsed: user.wordsUsed,
        wordsRemaining: Math.max(0, user.wordLimit - user.wordsUsed),
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      stats: {
        totalRewrites,
        totalDocuments,
        wordsUsedPercentage: Math.min(100, Math.round((user.wordsUsed / (user.wordLimit || 1)) * 100)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update user profile and writing preferences
 * @route  PATCH /api/user/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    await user.save();

    return successResponse(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
      'Profile updated successfully.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Change account password
 * @route  POST /api/user/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password does not match.', 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, {}, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get comprehensive monthly usage history
 * @route  GET /api/user/usage
 */
export const getUsageStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const usageRecords = await Usage.find({ userId: req.user._id }).sort({ yearMonth: -1 }).limit(12);

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthUsage = usageRecords.find((u) => u.yearMonth === currentYearMonth) || {
      wordsProcessed: user.wordsUsed,
      requestsCount: 0,
      filesProcessed: 0,
      aiGenerations: 0,
      toolBreakdown: {},
    };

    return successResponse(res, {
      currentMonth: {
        yearMonth: currentYearMonth,
        wordLimit: user.wordLimit,
        wordsUsed: user.wordsUsed,
        wordsRemaining: Math.max(0, user.wordLimit - user.wordsUsed),
        percentageUsed: Math.min(100, Math.round((user.wordsUsed / (user.wordLimit || 1)) * 100)),
        ...currentMonthUsage,
      },
      history: usageRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Submit user feedback or rating
 * @route  POST /api/user/feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, feedbackType, toolUsed, comment, originalSnippet, rewrittenSnippet } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 'Please provide a star rating between 1 and 5.', 400);
    }

    const feedback = await Feedback.create({
      userId: req.user ? req.user._id : null,
      userEmail: req.user ? req.user.email : req.body.email || 'guest@humanly.app',
      toolUsed: toolUsed || 'humanizer',
      rating,
      feedbackType: feedbackType || 'rewrite_quality',
      comment,
      originalSnippet,
      rewrittenSnippet,
    });

    return successResponse(res, feedback, 'Thank you for your feedback!', 201);
  } catch (error) {
    next(error);
  }
};
