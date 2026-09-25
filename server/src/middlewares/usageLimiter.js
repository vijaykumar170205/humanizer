import User from '../models/User.js';
import Usage from '../models/Usage.js';
import { countWords } from '../utils/textProcessor.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Check if the user has remaining word quota for the request
 */
export const checkUsageLimit = (estimatedWordField = 'text') => {
  return async (req, res, next) => {
    // Determine the word count of the incoming payload
    const text = req.body[estimatedWordField] || req.body.originalText || req.body.topic || '';
    const incomingWords = countWords(text);
    req.incomingWords = incomingWords;

    // 1. Guest user check
    if (!req.user) {
      // Allow free trial requests up to 600 words for guests
      const GUEST_WORD_LIMIT = 600;
      if (incomingWords > GUEST_WORD_LIMIT) {
        return errorResponse(
          res,
          `Guest limit is ${GUEST_WORD_LIMIT} words. Please create a free account to process larger documents.`,
          429,
          { currentWordCount: incomingWords, guestLimit: GUEST_WORD_LIMIT }
        );
      }
      return next();
    }

    // 2. Registered user check
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return errorResponse(res, 'User not found.', 404);
      }

      // Check if user has exceeded their monthly allowance
      if (user.wordsUsed + incomingWords > user.wordLimit) {
        return errorResponse(
          res,
          `Your monthly usage limit of ${user.wordLimit.toLocaleString()} words has been reached (${user.wordsUsed.toLocaleString()} used). Please upgrade your plan for more capacity.`,
          429,
          {
            plan: user.plan,
            wordsUsed: user.wordsUsed,
            wordLimit: user.wordLimit,
            wordsRemaining: Math.max(0, user.wordLimit - user.wordsUsed),
            requestedWords: incomingWords,
          }
        );
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Error checking usage limit:', error);
      next(); // Proceed gracefully if db check fails
    }
  };
};

/**
 * Record and increment usage after successful AI processing
 */
export const recordUsage = async ({ userId, wordsProcessed, toolUsed = 'humanizer', filesProcessed = 0 }) => {
  if (!userId) return;

  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Update User model counter
    await User.findByIdAndUpdate(userId, {
      $inc: { wordsUsed: wordsProcessed },
    });

    // 2. Update or create monthly Usage breakdown
    const toolField = `toolBreakdown.${toolUsed}`;
    await Usage.findOneAndUpdate(
      { userId, yearMonth },
      {
        $inc: {
          wordsProcessed: wordsProcessed,
          requestsCount: 1,
          filesProcessed: filesProcessed,
          aiGenerations: 1,
          [toolField]: 1,
        },
        $set: { lastRequestAt: now },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error recording usage analytics:', error.message);
  }
};
