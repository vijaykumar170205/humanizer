import { countWords } from '../../utils/textProcessor.js';
import { embeddingService, EmbeddingService } from '../embeddings/embeddingService.js';
import { TextAnalyzer } from '../analysis/textAnalyzer.js';
import { config } from '../../config/env.js';

export class OutputValidator {
  /**
   * Validate rewritten output against original input and extracted protected entities
   */
  static async validate({ originalText, rewrittenText, analysis, options = {} }) {
    const issues = [];
    const minSimilarity = options.minSemanticSimilarity || config.validation?.minSemanticSimilarity || 0.65;

    // 1. Basic Validity Checks
    if (!rewrittenText || typeof rewrittenText !== 'string' || !rewrittenText.trim()) {
      return {
        isValid: false,
        score: 0,
        issues: ['Rewritten output is completely empty.'],
        cleanedText: '',
        details: { missingItems: [], bannedFillers: [], burstinessCV: { cv: 0 } },
      };
    }

    let cleanedText = rewrittenText.trim();

    // Clean common LLM preambles
    cleanedText = cleanedText
      .replace(/^(Here is the (rewritten|revised|humanized) text:?|Here['’]s the (rewritten|revised|humanized) version:?|Sure,? here is the rewrite:?|Rewritten text:?|Reconstructed notes:?|Core notes:?)\s*/i, '')
      .replace(/```[a-z]*\n([\s\S]*?)\n```/i, '$1')
      .trim();

    const origWordCount = analysis?.wordCount || countWords(originalText);
    const rewriteWordCount = countWords(cleanedText);

    // Exact duplicate check (for texts > 8 words)
    if (origWordCount > 8 && originalText.trim().toLowerCase() === cleanedText.toLowerCase()) {
      issues.push('Output is an exact un-rewritten duplicate of the input.');
    }

    // 2. Protected Content Preservation Check
    const protectedContent = analysis?.protectedContent || {
      urls: [],
      emails: [],
      numbers: [],
      citations: [],
      codeBlocks: [],
    };

    const missingItems = [];

    // Check URLs
    if (protectedContent.urls && protectedContent.urls.length > 0) {
      for (const url of protectedContent.urls) {
        if (!cleanedText.includes(url)) {
          missingItems.push({ type: 'url', value: url });
        }
      }
    }

    // Check Emails
    if (protectedContent.emails && protectedContent.emails.length > 0) {
      for (const email of protectedContent.emails) {
        if (!cleanedText.toLowerCase().includes(email.toLowerCase())) {
          missingItems.push({ type: 'email', value: email });
        }
      }
    }

    // Check Citations
    if (protectedContent.citations && protectedContent.citations.length > 0) {
      for (const citation of protectedContent.citations) {
        if (!cleanedText.includes(citation)) {
          missingItems.push({ type: 'citation', value: citation });
        }
      }
    }

    // Check Numbers / Statistics (critical factual data)
    if (protectedContent.numbers && protectedContent.numbers.length > 0) {
      const normalizedCleaned = cleanedText.replace(/,/g, '');
      for (const num of protectedContent.numbers) {
        const cleanNum = num.replace(/[^\d.]/g, '');
        const hasDirectMatch = cleanedText.includes(num);
        const hasCleanMatch = cleanNum.length > 0 && normalizedCleaned.includes(cleanNum);
        if (!hasDirectMatch && !hasCleanMatch) {
          missingItems.push({ type: 'number', value: num });
        }
      }
    }

    if (missingItems.length > 0) {
      issues.push(`Missing ${missingItems.length} protected entity/number from original text.`);
    }

    // 3. Length & Word Count Constraints Verification (Strict ±10% for natural human rewrite)
    const minAllowedWords = Math.floor(origWordCount * 0.88);
    const maxAllowedWords = Math.ceil(origWordCount * 1.12);
    let isLengthViolated = false;

    if (origWordCount >= 6) {
      if (rewriteWordCount < minAllowedWords || rewriteWordCount > maxAllowedWords) {
        isLengthViolated = true;
        issues.push(
          `Word count constraint violation: Output length (${rewriteWordCount} words) is outside the required ±10% range (${minAllowedWords}-${maxAllowedWords} words) of original (${origWordCount} words).`
        );
      }
    }

    // 4. Repetition & Looping Detection
    const sentences = cleanedText.split(/[.!?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 5);
    const sentenceSet = new Set();
    let hasRepetitiveSentences = false;
    for (const s of sentences) {
      if (sentenceSet.has(s)) {
        hasRepetitiveSentences = true;
        break;
      }
      sentenceSet.add(s);
    }
    if (hasRepetitiveSentences) {
      issues.push('Detected repetitive or looping sentences in the output.');
    }

    // 5. Real-Time AI Detector Audit (Anti-Detection Gate)
    const burstinessCV = TextAnalyzer.computeBurstinessCV(cleanedText);
    const bannedFillers = TextAnalyzer.detectBannedFillers(cleanedText);
    const aiDetection = TextAnalyzer.estimateAiLikelihood(cleanedText);
    let isAiDetected = false;

    if (bannedFillers.length > 0) {
      isAiDetected = true;
      issues.push(`AI Detector warning: Output contains ${bannedFillers.length} overused AI marker(s): ${bannedFillers.slice(0, 3).join(', ')}.`);
    }

    if (burstinessCV.sentenceCount >= 3 && burstinessCV.cv < 0.40) {
      isAiDetected = true;
      issues.push(`AI Detector warning: Low burstiness (CV: ${burstinessCV.cv}). Human writing requires varied sentence lengths.`);
    }

    if (aiDetection.aiLikelihood > 20) {
      isAiDetected = true;
      issues.push(`AI Detector warning: Synthetic probability is ${aiDetection.aiLikelihood}% (must be <= 20% for 100% human score).`);
    }

    // 6. Semantic Similarity Heuristic
    let semanticSimilarity = 0.85;
    try {
      const [origEmbedding, rewriteEmbedding] = await Promise.all([
        embeddingService.generateEmbedding(originalText),
        embeddingService.generateEmbedding(cleanedText),
      ]);

      if (origEmbedding && rewriteEmbedding) {
        semanticSimilarity = Number(
          EmbeddingService.cosineSimilarity(origEmbedding, rewriteEmbedding).toFixed(4)
        );

        if (semanticSimilarity < minSimilarity) {
          issues.push(
            `Semantic similarity (${semanticSimilarity}) is below threshold (${minSimilarity}), indicating potential meaning drift.`
          );
        }
      }
    } catch (embErr) {
      // Fallback token Jaccard heuristic
      const origTokens = new Set(originalText.toLowerCase().split(/\s+/));
      const rewriteTokens = new Set(cleanedText.toLowerCase().split(/\s+/));
      const intersection = new Set([...origTokens].filter((x) => rewriteTokens.has(x)));
      const union = new Set([...origTokens, ...rewriteTokens]);
      semanticSimilarity = union.size > 0 ? Number((intersection.size / union.size).toFixed(2)) : 0.8;
    }

    // Score calculation
    const protectedPreservationRate =
      protectedContent.totalProtectedItems > 0
        ? Math.max(0, 1 - missingItems.length / protectedContent.totalProtectedItems)
        : 1.0;

    const overallScore = Number(
      Math.min(1.0, semanticSimilarity * 0.5 + protectedPreservationRate * 0.3 + (aiDetection.humanLikelihood / 100) * 0.2).toFixed(2)
    );

    const isValid =
      issues.length === 0 ||
      (missingItems.length === 0 &&
        semanticSimilarity >= minSimilarity &&
        !isLengthViolated &&
        !hasRepetitiveSentences &&
        !isAiDetected);

    return {
      isValid,
      score: overallScore,
      cleanedText,
      issues,
      details: {
        semanticSimilarity,
        protectedPreservationRate,
        missingItems,
        burstinessCV,
        bannedFillers,
        aiDetection,
        isAiDetected,
        hasRepetitiveSentences,
        isLengthViolated,
        minAllowedWords,
        maxAllowedWords,
        origWordCount,
        rewriteWordCount,
      },
    };
  }

  /**
   * Build targeted corrective instruction for LLM retry
   */
  static buildCorrectivePrompt(validationResult) {
    if (!validationResult || validationResult.isValid) return '';

    const missing = validationResult.details?.missingItems || [];
    const missingDescriptions = missing.map((m) => `"${m.value}" (${m.type})`).join(', ');
    const isLengthViolated = validationResult.details?.isLengthViolated;
    const origWordCount = validationResult.details?.origWordCount;
    const minAllowedWords = validationResult.details?.minAllowedWords;
    const maxAllowedWords = validationResult.details?.maxAllowedWords;
    const rewriteWordCount = validationResult.details?.rewriteWordCount;
    const hasRepetitiveSentences = validationResult.details?.hasRepetitiveSentences;
    const semanticSimilarity = validationResult.details?.semanticSimilarity;
    const isAiDetected = validationResult.details?.isAiDetected;
    const fillers = validationResult.details?.bannedFillers || [];

    let prompt = `CORRECTION REQUIRED: Your previous rewrite failed writing constraints.`;

    if (missing.length > 0) {
      prompt += `\n- YOU MUST PRESERVE the following exact facts/entities/numbers: ${missingDescriptions}.`;
    }

    if (isAiDetected) {
      prompt += `\n- CRITICAL AI DETECTOR EVASION DIRECTIVE:
  * You MUST radically vary sentence lengths. Mix punchy short sentences (3 to 7 words) with long compound-complex sentences (25 to 35 words).
  * Use natural em-dashes (—) and contractions (it's, didn't, wasn't, can't, here's, we've).
  * BANNED PHRASES: Do NOT use: ${fillers.length ? fillers.join(', ') : 'moreover, furthermore, delve, tapestry, testament to, plays a crucial role, in conclusion'}.
  * Never begin sentences with participial '-ing' openers or repetitive transitions.`;
    }

    if (isLengthViolated) {
      if (rewriteWordCount < minAllowedWords) {
        prompt += `\n- LENGTH SHORTAGE: Output was ${rewriteWordCount} words. Target is ${minAllowedWords}-${maxAllowedWords} words. Expand ideas with rich descriptive context while keeping a 1:1 fact ratio.`;
      } else {
        prompt += `\n- LENGTH EXCESS: Output was ${rewriteWordCount} words, exceeding ${maxAllowedWords} words. Tighten phrasing while keeping all facts.`;
      }
    }

    if (hasRepetitiveSentences) {
      prompt += `\n- ELIMINATE REPETITION: Do not repeat sentences or thoughts.`;
    }

    if (semanticSimilarity !== undefined && semanticSimilarity < 0.65) {
      prompt += `\n- MEANING PRESERVATION: Keep the exact core meaning and message of the original text.`;
    }

    prompt += `\nEnsure the rewrite is natural, human, authentic, and accurately preserves all names, numbers, and facts without preamble.`;

    return prompt;
  }
}

export default OutputValidator;
