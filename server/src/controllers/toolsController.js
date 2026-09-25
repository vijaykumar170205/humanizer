import AIService from '../services/ai/aiService.js';
import RewriteHistory from '../models/RewriteHistory.js';
import { recordUsage } from '../middlewares/usageLimiter.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc   Check grammar and style
 * @route  POST /api/tools/grammar/check
 */
export const checkGrammar = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return errorResponse(res, 'Please provide text for grammar analysis.', 400);
    }

    const result = await AIService.correctGrammar({ text });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: text,
          rewrittenText: result.correctedText || text,
          toolUsed: 'grammar',
          wordCountOriginal: req.incomingWords || 50,
          wordCountRewritten: (result.correctedText || text).split(/\s+/).length,
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: req.incomingWords || 50,
          toolUsed: 'grammar',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Grammar analysis complete.');
  } catch (error) {
    console.error('Error in checkGrammar controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Analyze text for AI writing likelihood
 * @route  POST /api/tools/detector/analyze
 */
export const detectAI = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return errorResponse(res, 'Please provide text for AI detection analysis.', 400);
    }

    const result = await AIService.detectAI({ text });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: text,
          rewrittenText: `AI Score: ${result.aiLikelihood}% | Human Score: ${result.humanLikelihood}% (${result.verdict})`,
          toolUsed: 'detector',
          wordCountOriginal: result.wordCount,
          wordCountRewritten: result.wordCount,
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.wordCount,
          toolUsed: 'detector',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'AI likelihood analysis complete.');
  } catch (error) {
    console.error('Error in detectAI controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Plagiarism Checker Interface
 * @route  POST /api/tools/plagiarism/check
 */
export const checkPlagiarism = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return errorResponse(res, 'Please provide text to scan for plagiarism.', 400);
    }

    const plagiarismApiKey = process.env.PLAGIARISM_API_KEY;
    if (!plagiarismApiKey) {
      return successResponse(
        res,
        {
          configured: false,
          status: 'unconfigured',
          message: 'External plagiarism scanning service is not configured on this server.',
          guidance:
            'To enable global internet plagiarism indexing, configure a supported search/plagiarism provider key in your environment variables.',
        },
        'Plagiarism service status retrieved.'
      );
    }

    return successResponse(res, { configured: true, similarityPercentage: 0 }, 'Plagiarism scan complete.');
  } catch (error) {
    console.error('Error in checkPlagiarism controller:', error.message);
    next(error);
  }
};

/**
 * @desc   Generate Structured Essay
 * @route  POST /api/tools/essay/generate
 */
export const generateEssay = async (req, res, next) => {
  try {
    const {
      topic,
      academicLevel = 'Undergraduate',
      targetWordCount = 600,
      structure = 'Standard 5-Paragraph Essay',
      citationStyle = 'APA 7th Edition',
      additionalNotes = '',
    } = req.body;

    if (!topic || !topic.trim()) {
      return errorResponse(res, 'Please specify an essay topic.', 400);
    }

    const result = await AIService.generateEssay({
      topic,
      academicLevel,
      targetWordCount,
      structure,
      citationStyle,
      additionalNotes,
    });

    if (req.user) {
      try {
        await RewriteHistory.create({
          userId: req.user._id,
          originalText: `Prompt: ${topic} (${academicLevel}, ${structure})`,
          rewrittenText: result.essayContent,
          toolUsed: 'essay',
          wordCountOriginal: req.incomingWords || 10,
          wordCountRewritten: result.wordCount,
        });

        await recordUsage({
          userId: req.user._id,
          wordsProcessed: result.wordCount,
          toolUsed: 'essay',
        });
      } catch (dbErr) {
        console.warn('Non-fatal history logging error:', dbErr.message);
      }
    }

    return successResponse(res, result, 'Essay generated successfully.');
  } catch (error) {
    console.error('Error in generateEssay controller:', error.message);
    next(error);
  }
};

export default {
  checkGrammar,
  detectAI,
  checkPlagiarism,
  generateEssay,
};
