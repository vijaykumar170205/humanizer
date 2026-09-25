import User from '../models/User.js';
import RewriteHistory from '../models/RewriteHistory.js';
import Document from '../models/Document.js';
import Usage from '../models/Usage.js';
import Feedback from '../models/Feedback.js';
import AIProviderFactory from '../services/ai/aiProviderFactory.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';

/**
 * @desc   Get system-wide overview statistics
 * @route  GET /api/admin/stats
 */
export const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalRewrites = await RewriteHistory.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    // Aggregate total words processed across all users
    const totalWordsAggregate = await User.aggregate([
      { $group: { _id: null, totalWords: { $sum: '$wordsUsed' } } },
    ]);
    const platformWordsProcessed = totalWordsAggregate[0]?.totalWords || 0;

    // Plan distribution
    const planCounts = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    const systemInfo = {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    };

    return successResponse(res, {
      metrics: {
        totalUsers,
        activeUsers,
        totalRewrites,
        totalDocuments,
        totalFeedback,
        platformWordsProcessed,
      },
      planDistribution: planCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      systemInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get paginated user list
 * @route  GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search = '', plan = '', role = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (plan) query.plan = plan;
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginatedResponse(res, users, total, page, limit, 'Users retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update user role, plan, or active status
 * @route  PATCH /api/admin/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { plan, role, isActive, wordLimit } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (plan !== undefined) user.plan = plan;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (wordLimit !== undefined) user.wordLimit = Number(wordLimit);

    await user.save();

    return successResponse(res, user, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete a user
 * @route  DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    // Cleanup related history and documents
    await RewriteHistory.deleteMany({ userId: req.params.id });
    await Document.deleteMany({ userId: req.params.id });

    return successResponse(res, {}, 'User and associated data deleted.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get system health & AI providers diagnostics
 * @route  GET /api/admin/system-health
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    const aiHealth = await AIProviderFactory.getProvidersStatus();
    const dbState = mongoose.connection.readyState;
    const dbStateLabels = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

    return successResponse(res, {
      database: {
        status: dbState === 1 ? 'healthy' : 'degraded',
        state: dbStateLabels[dbState] || 'Unknown',
        host: mongoose.connection.host || 'local',
      },
      aiEngine: aiHealth,
      server: {
        uptime: `${Math.floor(process.uptime() / 60)} minutes`,
        memoryUsedMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get user feedback submissions
 * @route  GET /api/admin/feedback
 */
export const getFeedbackList = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(50);
    return successResponse(res, feedback, 'Feedback list retrieved.');
  } catch (error) {
    next(error);
  }
};
