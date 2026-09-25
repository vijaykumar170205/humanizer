import RewriteHistory from '../models/RewriteHistory.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';

/**
 * @desc   Get user rewrite history with filtering
 * @route  GET /api/history
 */
export const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tool, search, favoriteOnly } = req.query;
    const query = { userId: req.user._id };

    if (tool && tool !== 'all') {
      query.toolUsed = tool;
    }

    if (favoriteOnly === 'true') {
      query.isFavorite = true;
    }

    if (search) {
      query.$or = [
        { originalText: { $regex: search, $options: 'i' } },
        { rewrittenText: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await RewriteHistory.countDocuments(query);
    const history = await RewriteHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginatedResponse(res, history, total, page, limit, 'History records retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single history item
 * @route  GET /api/history/:id
 */
export const getHistoryById = async (req, res, next) => {
  try {
    const item = await RewriteHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return errorResponse(res, 'History record not found.', 404);
    }
    return successResponse(res, item, 'History record retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Toggle favorite status
 * @route  PATCH /api/history/:id/favorite
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const item = await RewriteHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return errorResponse(res, 'History record not found.', 404);
    }

    item.isFavorite = !item.isFavorite;
    await item.save();

    return successResponse(
      res,
      { id: item._id, isFavorite: item.isFavorite },
      item.isFavorite ? 'Marked as favorite.' : 'Removed from favorites.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete single history item
 * @route  DELETE /api/history/:id
 */
export const deleteHistory = async (req, res, next) => {
  try {
    const item = await RewriteHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return errorResponse(res, 'History record not found.', 404);
    }
    return successResponse(res, {}, 'History record deleted.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Clear entire rewrite history for user
 * @route  DELETE /api/history
 */
export const clearHistory = async (req, res, next) => {
  try {
    const result = await RewriteHistory.deleteMany({ userId: req.user._id });
    return successResponse(res, { deletedCount: result.deletedCount }, 'All history records cleared.');
  } catch (error) {
    next(error);
  }
};
