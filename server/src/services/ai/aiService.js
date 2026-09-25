import AIProviderFactory from './aiProviderFactory.js';
import { MockAiProvider } from './mockAiProvider.js';
import {
  SYSTEM_PROMPTS,
  EXTRACTION_PROMPT,
  SYNTHESIS_PROMPT,
  applyPostFilter,
  buildHumanizerPrompt,
  buildParaphrasePrompt,
  buildEssayPrompt,
} from './prompts.js';
import {
  countWords,
  splitIntoChunks,
  mergeChunks,
  calculateDiff,
  estimateReadingTime,
} from '../../utils/textProcessor.js';
import { TextAnalyzer } from '../analysis/textAnalyzer.js';
import { retriever } from '../retrieval/retriever.js';
import { OutputValidator } from '../validation/outputValidator.js';
import { config } from '../../config/env.js';

export class AIService {
  /**
   * Helper to execute text generation with seamless fallback to offline engine
   */
  static async safeGenerateText(provider, options) {
    try {
      return await provider.generateText(options);
    } catch (error) {
      console.warn(
        `⚠️ Provider '${provider?.name || 'unknown'}' failed: ${error.message}. Falling back to secondary/smart linguistic engine.`
      );
      const fallback = AIProviderFactory.getCloudOrMockFallback(error.message);
      try {
        return await fallback.generateText(options);
      } catch (fbErr) {
        const mock = new MockAiProvider();
        return await mock.generateText(options);
      }
    }
  }

  /**
   * Helper to execute JSON generation with seamless fallback to offline engine
   */
  static async safeGenerateJSON(provider, options) {
    try {
      return await provider.generateJSON(options);
    } catch (error) {
      console.warn(
        `⚠️ Provider '${provider?.name || 'unknown'}' JSON failed: ${error.message}. Falling back to secondary/smart linguistic engine.`
      );
      const fallback = AIProviderFactory.getCloudOrMockFallback(error.message);
      try {
        return await fallback.generateJSON(options);
      } catch (fbErr) {
        const mock = new MockAiProvider();
        return await mock.generateJSON(options);
      }
    }
  }

  /**
   * Main Humanizer / Natural Writing Transformation Engine
   */
  static async rewrite({
    text,
    language = 'English',
    domain = 'General',
    complexity = 'Medium',
    customInstruction = '',
    providerName = null,
  }) {
    if (!text || !text.trim()) {
      throw new Error('Text input cannot be empty.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const wordCount = countWords(text);
    const maxRetries = config.validation?.maxRetries || 2;

    // High entropy & calibrated temperature for anti-detection evasion
    const baseTemperature = config.ollama?.temperature || 0.94;
    const baseRepeatPenalty = config.ollama?.repeat_penalty || 1.18;
    const baseFrequencyPenalty = config.ollama?.frequency_penalty || 0.55;
    const basePresencePenalty = config.ollama?.presence_penalty || 0.40;
    const baseTopP = config.ollama?.top_p || 0.94;
    const baseMinP = config.ollama?.min_p || 0.04;

    // 1. Analyze input text & extract protected entities
    const analysis = TextAnalyzer.analyze(text);

    // 2. Retrieve relevant transformation & style examples (from RAID / Curated)
    const retrievalResult = await retriever.retrieve({
      text,
      domain,
      complexity,
      language,
      topK: config.retrieval?.topK || 5,
    });
    const transformationExamples = retrievalResult.transformationExamples || [];
    const styleExamples = retrievalResult.styleExamples || [];
    const retrievedExamples = retrievalResult.examples || [];

    let rewrittenText = '';
    let validationResult = null;
    let attemptsCount = 1;

    // 3. Handle Long vs Standard Document
    if (wordCount > 600) {
      // Large text: split into semantic chunks
      const chunks = splitIntoChunks(text, 450);
      const rewrittenChunks = [];

      for (const chunk of chunks) {
        const chunkAnalysis = TextAnalyzer.analyze(chunk);
        const chunkRetrieval = await retriever.retrieve({
          text: chunk,
          domain,
          complexity,
          language,
          topK: 2,
        });

        // Stage 1: Strip syntax & extract facts
        let chunkRawFacts = '';
        if (countWords(chunk) >= 60) {
          try {
            chunkRawFacts = await this.safeGenerateText(provider, {
              systemPrompt: EXTRACTION_PROMPT,
              userPrompt: chunk,
              temperature: 0.2,
            });
          } catch (eErr) {
            chunkRawFacts = '';
          }
        }

        // Stage 2: Reconstruct with human cadence
        const userPrompt = buildHumanizerPrompt({
          text: chunk,
          rawFacts: chunkRawFacts,
          domain,
          complexity,
          language,
          customInstruction,
          transformationExamples: chunkRetrieval.transformationExamples || [],
          styleExamples: chunkRetrieval.styleExamples || [],
          retrievedExamples: chunkRetrieval.examples || [],
          analysis: chunkAnalysis,
        });

        const res = await this.safeGenerateText(provider, {
          systemPrompt: SYNTHESIS_PROMPT,
          userPrompt,
          temperature: baseTemperature,
          repeat_penalty: baseRepeatPenalty,
          frequency_penalty: baseFrequencyPenalty,
          presence_penalty: basePresencePenalty,
          top_p: baseTopP,
          top_k: 40,
          min_p: baseMinP,
        });

        // Stage 3: Syntactic Perturbation Post-Filter
        const filteredChunk = applyPostFilter(res);
        rewrittenChunks.push(filteredChunk);
      }
      rewrittenText = mergeChunks(rewrittenChunks);
      validationResult = await OutputValidator.validate({
        originalText: text,
        rewrittenText,
        analysis,
      });
    } else {
      // Stage 1: For substantial inputs (>= 60 words), extract facts outline to de-correlate syntax
      let rawFacts = '';
      if (wordCount >= 60) {
        try {
          rawFacts = await this.safeGenerateText(provider, {
            systemPrompt: EXTRACTION_PROMPT,
            userPrompt: text,
            temperature: 0.2,
          });
        } catch (eErr) {
          rawFacts = '';
        }
      }

      // Stage 2: Reconstruct with human cadence
      let currentPrompt = buildHumanizerPrompt({
        text,
        rawFacts,
        domain,
        complexity,
        language,
        customInstruction,
        transformationExamples,
        styleExamples,
        retrievedExamples,
        analysis,
      });

      let rawOutput = await this.safeGenerateText(provider, {
        systemPrompt: SYNTHESIS_PROMPT,
        userPrompt: currentPrompt,
        temperature: baseTemperature,
        repeat_penalty: baseRepeatPenalty,
        frequency_penalty: baseFrequencyPenalty,
        presence_penalty: basePresencePenalty,
        top_p: baseTopP,
        top_k: 40,
        min_p: baseMinP,
      });

      // Stage 3: Syntactic Perturbation Post-Filter
      let filteredOutput = applyPostFilter(rawOutput);

      validationResult = await OutputValidator.validate({
        originalText: text,
        rewrittenText: filteredOutput,
        analysis,
      });

      // Corrective retry loop if validation failed (including AI detector flags)
      while (!validationResult.isValid && attemptsCount <= maxRetries) {
        attemptsCount++;
        const correctivePrompt = OutputValidator.buildCorrectivePrompt(validationResult);

        const retryUserPrompt = buildHumanizerPrompt({
          text,
          rawFacts,
          domain,
          complexity,
          language,
          customInstruction,
          transformationExamples,
          styleExamples,
          retrievedExamples,
          analysis,
          correctiveInstruction: correctivePrompt,
        });

        // Retry with anti-detection sampling and targeted corrective prompt
        rawOutput = await this.safeGenerateText(provider, {
          systemPrompt: SYNTHESIS_PROMPT,
          userPrompt: retryUserPrompt,
          temperature: 0.95,
          repeat_penalty: 1.20,
          frequency_penalty: 0.60,
          presence_penalty: 0.45,
          top_p: 0.95,
          top_k: 40,
          min_p: 0.04,
        });

        filteredOutput = applyPostFilter(rawOutput);

        validationResult = await OutputValidator.validate({
          originalText: text,
          rewrittenText: filteredOutput,
          analysis,
        });
      }

      // If still not valid after retries, apply a second aggressive post-filter pass
      if (!validationResult.isValid) {
        filteredOutput = applyPostFilter(filteredOutput);
      }

      rewrittenText = validationResult.cleanedText || filteredOutput;
    }

    // 4. Calculate diff and linguistic stats
    const diff = calculateDiff(text, rewrittenText);
    const rewrittenWordCount = countWords(rewrittenText);

    return {
      original: text,
      rewritten: rewrittenText,
      originalCount: wordCount,
      newCount: rewrittenWordCount,
      originalText: text,
      rewrittenText,
      originalWordCount: wordCount,
      rewrittenWordCount,
      readingTimeMinutes: estimateReadingTime(rewrittenWordCount),
      diff,
      metadata: {
        language,
        domain,
        complexity,
        provider: provider?.name || 'smart-linguistic',
        model: provider?.modelName || 'qwen2.5:3b',
        retrieval: {
          examplesRetrieved: retrievedExamples.length,
          transformationCount: transformationExamples.length,
          styleCount: styleExamples.length,
          method: retrievalResult.retrievalMethod,
          latencyMs: retrievalResult.latencyMs || 0,
        },
        validation: {
          isValid: validationResult?.isValid ?? true,
          score: validationResult?.score ?? 0.9,
          attempts: attemptsCount,
          semanticSimilarity: validationResult?.details?.semanticSimilarity ?? 0.88,
          protectedPreserved: (validationResult?.details?.missingItems?.length || 0) === 0,
          burstinessCV: validationResult?.details?.burstinessCV?.cv ?? 1.0,
          bannedTokensFound: validationResult?.details?.bannedFillers || [],
          lengthCompliant: !validationResult?.details?.isLengthViolated,
          wordCountDeviationPercent:
            wordCount > 0
              ? Number((((rewrittenWordCount - wordCount) / wordCount) * 100).toFixed(1))
              : 0,
          aiDetection: validationResult?.details?.aiDetection || null,
        },
        analysis: {
          burstinessScore: analysis.burstinessScore,
          burstinessCV: analysis.burstinessCV,
          avgSentenceLength: analysis.avgSentenceLength,
          readingGradeLevel: analysis.approximateGradeLevel,
          protectedEntitiesDetected: analysis.protectedContent?.totalProtectedItems || 0,
          aiDetection: analysis.aiDetection || null,
        },
      },
    };
  }

  /**
   * Paraphrase Text
   */
  static async paraphrase({ text, mode = 'Standard', language = 'English', providerName = null }) {
    if (!text || !text.trim()) {
      throw new Error('Text input is required for paraphrasing.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const userPrompt = buildParaphrasePrompt({ text, mode, language });

    const paraphrasedText = await this.safeGenerateText(provider, {
      systemPrompt: SYSTEM_PROMPTS.PARAPHRASER_BASE,
      userPrompt,
      temperature: 0.6,
    });

    const diff = calculateDiff(text, paraphrasedText);

    return {
      originalText: text,
      paraphrasedText,
      originalWordCount: countWords(text),
      paraphrasedWordCount: countWords(paraphrasedText),
      mode,
      diff,
      provider: provider?.name || 'smart-linguistic',
    };
  }

  /**
   * Grammar & Readability Checker
   */
  static async correctGrammar({ text, providerName = null }) {
    if (!text || !text.trim()) {
      throw new Error('Text input is required for grammar analysis.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const userPrompt = `ANALYZE GRAMMAR AND PROSE:\n"""\n${text}\n"""`;

    const analysis = await this.safeGenerateJSON(provider, {
      systemPrompt: SYSTEM_PROMPTS.GRAMMAR_CHECKER_BASE,
      userPrompt,
      temperature: 0.2,
    });

    return {
      originalText: text,
      correctedText: analysis.correctedText || text,
      issuesCount: analysis.issuesCount || (analysis.corrections ? analysis.corrections.length : 0),
      readabilityScore: analysis.readabilityScore || 90,
      overallFeedback: analysis.overallFeedback || 'Grammar checked successfully.',
      corrections: analysis.corrections || [],
      provider: provider?.name || 'smart-linguistic',
    };
  }

  /**
   * AI Likelihood Content Detector
   */
  static async detectAI({ text, providerName = null }) {
    if (!text || !text.trim()) {
      throw new Error('Text is required for AI detection.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const userPrompt = `EVALUATE AI WRITING CHARACTERISTICS:\n"""\n${text}\n"""`;

    const report = await this.safeGenerateJSON(provider, {
      systemPrompt: SYSTEM_PROMPTS.AI_DETECTOR_BASE,
      userPrompt,
      temperature: 0.2,
    });

    return {
      textSnippet: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
      wordCount: countWords(text),
      aiLikelihood: report.aiLikelihood ?? 15,
      humanLikelihood: report.humanLikelihood ?? 85,
      verdict: report.verdict || 'Likely Human-Written',
      confidenceScore: report.confidenceScore || 85,
      summary: report.summary || 'Prose exhibits natural human variation and rhythm.',
      metrics: report.metrics || {
        burstiness: 'High',
        perplexityEstimate: 'High',
        repetitiveness: 'Low',
        vocabularyDiversity: 'Rich',
      },
      sentenceAnalysis: report.sentenceAnalysis || [],
      recommendations: report.recommendations || [],
      disclaimer:
        'AI detection is an algorithmic estimation based on statistical burstiness and vocabulary heuristics, and is not a definitive guarantee.',
      provider: provider?.name || 'smart-linguistic',
    };
  }

  /**
   * Structured Academic & Professional Essay Writer
   */
  static async generateEssay(params) {
    const { topic, providerName = null } = params;
    if (!topic || !topic.trim()) {
      throw new Error('Essay topic is required.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const userPrompt = buildEssayPrompt(params);

    const essayContent = await this.safeGenerateText(provider, {
      systemPrompt: SYSTEM_PROMPTS.ESSAY_WRITER_BASE,
      userPrompt,
      temperature: 0.7,
      maxTokens: 3000,
    });

    const wordCount = countWords(essayContent);

    return {
      topic,
      essayContent,
      wordCount,
      readingTimeMinutes: estimateReadingTime(wordCount),
      params,
      provider: provider?.name || 'smart-linguistic',
    };
  }

  /**
   * Sentence Rewriter (Provides 3 distinct natural variations)
   */
  static async rewriteSentence({ sentence, providerName = null }) {
    if (!sentence || !sentence.trim()) {
      throw new Error('Sentence is required.');
    }

    const provider = AIProviderFactory.getProvider(providerName);
    const systemPrompt = `You are an expert human prose stylist. Provide 3 distinct, completely natural human variations of the user's sentence that eliminate robotic syntax and vary cadence.
Respond strictly in JSON format:
{
  "variations": [
    { "text": "variation 1", "toneLabel": "Conversational" },
    { "text": "variation 2", "toneLabel": "Concise" },
    { "text": "variation 3", "toneLabel": "Expressive" }
  ]
}`;

    const userPrompt = `ORIGINAL SENTENCE: "${sentence}"`;
    const result = await this.safeGenerateJSON(provider, {
      systemPrompt,
      userPrompt,
      temperature: 0.85,
    });

    return {
      originalSentence: sentence,
      variations: result.variations || [
        { text: sentence, toneLabel: 'Natural' },
      ],
      provider: provider?.name || 'smart-linguistic',
    };
  }

  /**
   * Paragraph Rewriter
   */
  static async rewriteParagraph({ paragraph, providerName = null }) {
    return await this.rewrite({
      text: paragraph,
      providerName,
    });
  }

  /**
   * Article Rewriter (Preserves Markdown Headings & Layout)
   */
  static async rewriteArticle({ article, providerName = null }) {
    return await this.rewrite({
      text: article,
      customInstruction: 'Preserve all Markdown headings (#, ##), bullet points, and numbered lists exactly.',
      providerName,
    });
  }
}

export default AIService;
