import * as Diff from 'diff';

/**
 * Text Processing and Metrics Utilities
 */

export const countWords = (text = '') => {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Match non-whitespace character sequences
  const words = trimmed.match(/\S+/g);
  return words ? words.length : 0;
};

export const countCharacters = (text = '', ignoreWhitespace = false) => {
  if (!text || typeof text !== 'string') return 0;
  if (ignoreWhitespace) {
    return text.replace(/\s+/g, '').length;
  }
  return text.length;
};

export const cleanWhitespace = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const estimateReadingTime = (wordCount = 0) => {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes < 1 ? 1 : minutes;
};

/**
 * Split text into individual sentences while preserving internal dots in URLs, decimals, emails, and abbreviations.
 */
export const splitIntoSentences = (text = '') => {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean) return [];

  // Mask URLs, Emails, and Decimals to prevent internal dots from splitting sentences
  const maskedUrls = [];
  let temp = clean.replace(/https?:\/\/[^\s"'<>)]+/gi, (match) => {
    const punctMatch = match.match(/[.,;:!?]+$/);
    const trailingPunct = punctMatch ? punctMatch[0] : '';
    const cleanUrl = trailingPunct ? match.slice(0, -trailingPunct.length) : match;
    const key = `__S_URL_${maskedUrls.length}__`;
    maskedUrls.push({ key, match: cleanUrl });
    return key + trailingPunct;
  });

  const maskedEmails = [];
  temp = temp.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, (match) => {
    const key = `__S_EMAIL_${maskedEmails.length}__`;
    maskedEmails.push({ key, match });
    return key;
  });

  const maskedDecimals = [];
  temp = temp.replace(/\b\d+\.\d+\b/g, (match) => {
    const key = `__S_DEC_${maskedDecimals.length}__`;
    maskedDecimals.push({ key, match });
    return key;
  });

  temp = temp.replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|e\.g|i\.e|etc)\./gi, '$1__DOT__');

  const raw = temp.match(/[^.!?\n]+(?:[.!?]+(?=[\s\n]|$)|$)/g) || [temp];

  return raw
    .map((s) => {
      let restored = s.trim().replace(/__DOT__/g, '.');
      maskedDecimals.forEach(({ key, match }) => {
        restored = restored.replaceAll(key, match);
      });
      maskedEmails.forEach(({ key, match }) => {
        restored = restored.replaceAll(key, match);
      });
      maskedUrls.forEach(({ key, match }) => {
        restored = restored.replaceAll(key, match);
      });
      return restored;
    })
    .filter((s) => countWords(s) > 0);
};

/**
 * Split text into semantic chunks (by paragraphs) to prevent exceeding LLM context boundaries.
 */
export const splitIntoChunks = (text = '', maxWords = 500) => {
  if (!text) return [];
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = countWords(para);
    if (currentWordCount + paraWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [para];
      currentWordCount = paraWords;
    } else {
      currentChunk.push(para);
      currentWordCount += paraWords;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
};

export const mergeChunks = (chunks = []) => {
  return chunks.filter(Boolean).join('\n\n');
};

/**
 * Extract Markdown Headings while preserving layout
 */
export const extractHeadings = (text = '') => {
  const lines = text.split('\n');
  const headings = [];
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }
  return headings;
};

/**
 * Compute word-level and character-level diff between original and rewritten text
 */
export const calculateDiff = (original = '', rewritten = '') => {
  const wordDiff = Diff.diffWords(original || '', rewritten || '');
  
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  const diffChunks = wordDiff.map((part) => {
    const wordsInPart = countWords(part.value);
    if (part.added) {
      addedCount += wordsInPart;
    } else if (part.removed) {
      removedCount += wordsInPart;
    } else {
      unchangedCount += wordsInPart;
    }

    return {
      value: part.value,
      added: !!part.added,
      removed: !!part.removed,
    };
  });

  const totalWords = addedCount + unchangedCount;
  const similarityScore = totalWords > 0 
    ? Math.round((unchangedCount / (unchangedCount + addedCount + removedCount || 1)) * 100) 
    : 100;

  return {
    diffChunks,
    stats: {
      addedWords: addedCount,
      removedWords: removedCount,
      unchangedWords: unchangedCount,
      similarityPercentage: Math.max(0, Math.min(100, similarityScore)),
      changePercentage: Math.max(0, Math.min(100, 100 - similarityScore)),
    }
  };
};

/**
 * Heuristic metrics for AI detection & readability evaluation
 */
export const computeTextLinguisticMetrics = (text = '') => {
  if (!text) return { sentencesCount: 0, avgSentenceLength: 0, burstinessScore: 0, vocabularyRichness: 0 };
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const sentenceLengths = sentences.map(s => countWords(s)).filter(len => len > 0);
  
  const totalWords = countWords(text);
  const avgSentenceLength = sentenceLengths.length > 0 
    ? Number((totalWords / sentenceLengths.length).toFixed(1)) 
    : 0;

  // Calculate standard deviation of sentence lengths (Burstiness measure)
  let variance = 0;
  if (sentenceLengths.length > 1) {
    const mean = avgSentenceLength;
    variance = sentenceLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sentenceLengths.length;
  }
  const burstinessScore = Number(Math.sqrt(variance).toFixed(1));

  // Vocabulary richness (Type-Token Ratio)
  const uniqueWords = new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []));
  const vocabularyRichness = totalWords > 0 
    ? Number(((uniqueWords.size / totalWords) * 100).toFixed(1)) 
    : 0;

  return {
    sentencesCount: sentences.length,
    avgSentenceLength,
    burstinessScore,
    vocabularyRichness,
    sentenceLengths,
  };
};
