import AIService from '../services/ai/aiService.js';
import RewriteHistory from '../models/RewriteHistory.js';
import { recordUsage } from '../middlewares/usageLimiter.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc   Main Humanizer & Natural Writing Transformation
 * @route  POST /api/rewrite
 */
export const rewriteText = async (req, res, next) => {
  try {
    const {
      text,
      language = 'English',
      domain = 'General',
      complexity = 'Medium',
      customInstruction = '',
    } = req.body;

    if (!text || !text.trim()) {
      return errorResponse(res, 'Please provide text to rewrite.', 400);
    }

    const result = await AIService.rewrite({
      text,
      language,
      domain,
      complexity,
      customInstruction,
    });

    // Record history & usage safely if user is authenticated
    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: text,
          rewrittenText: result.rewrittenText,
          toolUsed: 'humanizer',
          language,
          customInstruction,
          wordCountOriginal: result.originalWordCount,
          wordCountRewritten: result.rewrittenWordCount,
          diffSummary: {
            addedWords: result.diff?.stats?.addedWords || 0,
            removedWords: result.diff?.stats?.removedWords || 0,
            similarityPercentage: result.diff?.stats?.similarityPercentage || 100,
          },
          aiProvider: result.metadata?.provider || 'smart-linguistic',
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.originalWordCount,
          toolUsed: 'humanizer',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Text rewritten successfully.');
  } catch (error) {
    console.error('Error in rewriteText controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Paraphrase text with chosen mode
 * @route  POST /api/rewrite/paraphrase
 */
export const paraphraseText = async (req, res, next) => {
  try {
    const { text, mode = 'Standard', language = 'English' } = req.body;

    if (!text || !text.trim()) {
      return errorResponse(res, 'Please provide text to paraphrase.', 400);
    }

    const result = await AIService.paraphrase({ text, mode, language });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: text,
          rewrittenText: result.paraphrasedText,
          toolUsed: 'paraphraser',
          tone: mode,
          language,
          wordCountOriginal: result.originalWordCount,
          wordCountRewritten: result.paraphrasedWordCount,
          diffSummary: {
            addedWords: result.diff?.stats?.addedWords || 0,
            removedWords: result.diff?.stats?.removedWords || 0,
            similarityPercentage: result.diff?.stats?.similarityPercentage || 100,
          },
          aiProvider: result.provider || 'smart-linguistic',
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.originalWordCount,
          toolUsed: 'paraphraser',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Text paraphrased successfully.');
  } catch (error) {
    console.error('Error in paraphraseText controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Sentence Rewriter (returns 3 variations)
 * @route  POST /api/rewrite/sentence
 */
export const rewriteSentence = async (req, res, next) => {
  try {
    const { sentence } = req.body;

    if (!sentence || !sentence.trim()) {
      return errorResponse(res, 'Please provide a sentence.', 400);
    }

    const result = await AIService.rewriteSentence({ sentence });

    if (req.user) {
      try {
        const topVariation = result.variations?.[0]?.text || sentence;
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: sentence,
          rewrittenText: topVariation,
          toolUsed: 'sentence',
          wordCountOriginal: req.incomingWords || 15,
          wordCountRewritten: topVariation.split(/\s+/).length,
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: req.incomingWords || 15,
          toolUsed: 'sentence',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Sentence variations generated.');
  } catch (error) {
    console.error('Error in rewriteSentence controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Paragraph Rewriter
 * @route  POST /api/rewrite/paragraph
 */
export const rewriteParagraph = async (req, res, next) => {
  try {
    const { paragraph } = req.body;

    if (!paragraph || !paragraph.trim()) {
      return errorResponse(res, 'Please provide a paragraph.', 400);
    }

    const result = await AIService.rewriteParagraph({ paragraph });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: paragraph,
          rewrittenText: result.rewrittenText,
          toolUsed: 'paragraph',
          wordCountOriginal: result.originalWordCount,
          wordCountRewritten: result.rewrittenWordCount,
          diffSummary: {
            addedWords: result.diff?.stats?.addedWords || 0,
            removedWords: result.diff?.stats?.removedWords || 0,
            similarityPercentage: result.diff?.stats?.similarityPercentage || 100,
          },
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.originalWordCount,
          toolUsed: 'paragraph',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Paragraph rewritten successfully.');
  } catch (error) {
    console.error('Error in rewriteParagraph controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Article Rewriter
 * @route  POST /api/rewrite/article
 */
export const rewriteArticle = async (req, res, next) => {
  try {
    const { article } = req.body;

    if (!article || !article.trim()) {
      return errorResponse(res, 'Please provide article text.', 400);
    }

    const result = await AIService.rewriteArticle({ article });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: article,
          rewrittenText: result.rewrittenText,
          toolUsed: 'article',
          wordCountOriginal: result.originalWordCount,
          wordCountRewritten: result.rewrittenWordCount,
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.originalWordCount,
          toolUsed: 'article',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Article rewritten successfully.');
  } catch (error) {
    console.error('Error in rewriteArticle controller:', error.message);
    next(error);
  }
};

export const processRewrite = rewriteText;

export default {
  rewriteText,
  processRewrite,
  paraphraseText,
  rewriteSentence,
  rewriteParagraph,
  rewriteArticle,
};
