import {
  countWords,
  countCharacters,
  computeTextLinguisticMetrics,
  splitIntoSentences,
} from '../../utils/textProcessor.js';

export class TextAnalyzer {
  /**
   * Common English stop words for n-gram & repetition filtering
   */
  static STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
    'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
    'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
    'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
    'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
    'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
    'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
    'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
    'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
    'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
    'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
    'yourselves'
  ]);

  /**
   * Deeply analyze text for style, syntax, readability, and protected entities
   */
  static analyze(text = '') {
    if (!text || typeof text !== 'string') {
      return this.emptyAnalysis();
    }

    const clean = text.trim();
    if (!clean) {
      return this.emptyAnalysis();
    }

    const wordCount = countWords(clean);
    const charCount = countCharacters(clean);
    const charCountNoSpaces = countCharacters(clean, true);

    const paragraphs = clean.split(/\n\n+/).filter(Boolean);
    const paragraphCount = paragraphs.length;

    // Sentence extraction using entity-safe boundary splitter
    const sentences = splitIntoSentences(clean);
    const sentenceCount = Math.max(1, sentences.length);

    const sentenceLengths = sentences.map((s) => countWords(s));
    const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(1));
    const minSentenceLength = sentenceLengths.length > 0 ? Math.min(...sentenceLengths) : 0;
    const maxSentenceLength = sentenceLengths.length > 0 ? Math.max(...sentenceLengths) : 0;

    // Standard deviation and Coefficient of Variation (CV) for burstiness
    let variance = 0;
    if (sentenceLengths.length > 1) {
      variance =
        sentenceLengths.reduce((acc, val) => acc + Math.pow(val - avgSentenceLength, 2), 0) /
        sentenceLengths.length;
    }
    const standardDeviation = Math.sqrt(variance);
    const burstinessScore = Number(standardDeviation.toFixed(1));
    // CV = standard deviation / mean
    const burstinessCV =
      sentenceLengths.length > 1 && avgSentenceLength > 0
        ? Number((standardDeviation / avgSentenceLength).toFixed(3))
        : 1.0; // single sentence defaults to high variation

    // Sentence length breakdown
    const shortSentences = sentences.filter((s) => countWords(s) < 8);
    const longSentences = sentences.filter((s) => countWords(s) > 22);

    // Banned AI Clichés & Fillers Detection
    const bannedFillers = this.detectBannedFillers(clean);

    // Vocabulary metrics
    const words = clean.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
    const uniqueWords = new Set(words);
    const typeTokenRatio = wordCount > 0 ? Number(((uniqueWords.size / wordCount) * 100).toFixed(1)) : 0;

    // Repeated phrases (2-word and 3-word ngrams)
    const repeatedPhrases = this.findRepeatedPhrases(words);

    // Readability approximation (Flesch Reading Ease & Grade Level)
    const syllableCount = this.estimateSyllables(words);
    const fleschEase = this.computeFleschEase(wordCount, sentenceCount, syllableCount);
    const readingGradeLevel = this.computeFleschKincaidGrade(wordCount, sentenceCount, syllableCount);

    // Protected Content Extraction
    const protectedContent = this.extractProtectedContent(clean);

    const aiDetection = this.estimateAiLikelihood(clean);

    return {
      wordCount,
      charCount,
      charCountNoSpaces,
      paragraphCount,
      sentenceCount,
      avgSentenceLength,
      minSentenceLength,
      maxSentenceLength,
      burstinessScore,
      burstinessCV,
      isHumanBurstiness: burstinessCV >= 0.50 && bannedFillers.length === 0 && aiDetection.isHuman,
      bannedFillers,
      aiDetection,
      sentenceLengths,
      shortSentencesCount: shortSentences.length,
      longSentencesCount: longSentences.length,
      vocabularyRichness: typeTokenRatio,
      fleschReadingEase: fleschEase,
      approximateGradeLevel: readingGradeLevel,
      repeatedPhrases,
      protectedContent,
    };
  }

  /**
   * Banned AI Statistical Clichés and Fillers (120+ commercial detector markers)
   */
  static BANNED_FILLERS = [
    // Discourse & Transition Tropes
    'delve', 'delves', 'delving', 'tapestry', 'testament to', 'testament', 'stands as',
    'stands as a testament', 'serves as a testament', 'tribute to', 'moreover', 'furthermore',
    'additionally', 'in conclusion', 'to conclude', 'in summary', 'to sum up', 'notably',
    'importantly', 'on the other hand', 'at its core', 'first and foremost', 'last but not least',
    'in today\'s world', 'in today\'s fast-paced world', 'in the modern era', 'in today\'s society',
    'by and large', 'sheds light on', 'shed light on', 'shedding light on', 'paves the way',
    'paving the way', 'plays a crucial role', 'plays a pivotal role', 'plays a key role',
    'it is important to note', 'it is crucial to note', 'it is worth noting', 'it goes without saying',
    'it is essential to', 'it is imperative that', 'one cannot overlook', 'it remains to be seen',
    'serves as a reminder', 'serves as an example', 'striking a balance', 'strikes a balance',
    // AI Flagged Adjectives & Verbs
    'foster', 'fosters', 'fostering', 'pivotal', 'underscore', 'underscores', 'underscoring',
    'beacon', 'intricate', 'intricacies', 'plethora', 'multifaceted', 'seamlessly', 'paramount',
    'captivated', 'captivating', 'mesmerized', 'interplay', 'ultimately', 'vibrant', 'revolutionize',
    'revolutionizing', 'game-changer', 'transformative', 'nuanced', 'cornerstone', 'realm',
    'ever-evolving', 'holistic', 'ubiquitous', 'myriad', 'emboldened', 'unravel', 'unraveling',
    'unravels', 'invaluable', 'indispensable', 'dynamic landscape', 'complex landscape',
    'navigate the complexities', 'embark on', 'embarking on', 'harnessing the power',
    'harness the power', 'deep dive', 'overarching', 'intertwined', 'catalyst', 'epitome',
    'linchpin', 'panacea', 'paragon', 'salient', 'synergy', 'synergies', 'paradigm shift',
    'unwavering', 'resonate', 'resonates', 'resonating', 'quintessential', 'meticulous',
    'meticulously', 'profound impact', 'stunning array', 'crucial aspect', 'vital role',
    'in essence', 'it is noteworthy that', 'a rich blend', 'a vast array', 'beacon of hope',
    'breathtaking', 'ever-changing landscape', 'testament to the power', 'vital importance',
    'delve deeper', 'delving deeper'
  ];

  /**
   * Detect any banned AI fillers in text
   */
  static detectBannedFillers(text = '') {
    if (!text || typeof text !== 'string') return [];
    const lower = text.toLowerCase();
    const found = [];

    for (const filler of this.BANNED_FILLERS) {
      const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      if (regex.test(lower)) {
        found.push(filler);
      }
    }

    return Array.from(new Set(found));
  }

  /**
   * Compute Coefficient of Variation (CV) of sentence lengths and consecutive delta
   * CV = standard deviation / mean word count per sentence
   */
  static computeBurstinessCV(text = '') {
    if (!text || typeof text !== 'string') {
      return { cv: 1.0, mean: 0, standardDeviation: 0, sentenceCount: 0, sentenceLengths: [], consecutiveDeltas: [] };
    }
    const sentences = splitIntoSentences(text);
    const sentenceCount = sentences.length;

    if (sentenceCount <= 1) {
      return { cv: 1.0, mean: countWords(text), standardDeviation: 0, sentenceCount, sentenceLengths: [countWords(text)], consecutiveDeltas: [] };
    }

    const sentenceLengths = sentences.map((s) => countWords(s));
    const totalWords = sentenceLengths.reduce((a, b) => a + b, 0);
    const mean = totalWords / sentenceCount;

    const variance =
      sentenceLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sentenceCount;
    const standardDeviation = Math.sqrt(variance);
    const cv = mean > 0 ? Number((standardDeviation / mean).toFixed(3)) : 1.0;

    const consecutiveDeltas = [];
    for (let i = 0; i < sentenceLengths.length - 1; i++) {
      consecutiveDeltas.push(Math.abs(sentenceLengths[i] - sentenceLengths[i + 1]));
    }

    return {
      cv,
      mean: Number(mean.toFixed(1)),
      standardDeviation: Number(standardDeviation.toFixed(1)),
      sentenceCount,
      sentenceLengths,
      consecutiveDeltas,
    };
  }

  /**
   * Forensic algorithmic estimation of AI detection likelihood (0% - 100%)
   * Models the decision boundaries of Turnitin, GPTZero, CopyLeaks, and ZeroGPT.
   */
  static estimateAiLikelihood(text = '') {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return { aiLikelihood: 0, humanLikelihood: 100, isHuman: true, flaggedReasons: [] };
    }

    const clean = text.trim();
    const wordCount = countWords(clean);
    if (wordCount < 10) {
      return { aiLikelihood: 10, humanLikelihood: 90, isHuman: true, flaggedReasons: [] };
    }

    const flaggedReasons = [];
    let aiScore = 15; // base human baseline

    // 1. Check Banned AI Statistical Fillers & Discourse Tropes
    const fillers = this.detectBannedFillers(clean);
    if (fillers.length > 0) {
      const fillerPenalty = Math.min(65, fillers.length * 20);
      aiScore += fillerPenalty;
      flaggedReasons.push(`Contains ${fillers.length} overused AI marker(s): ${fillers.slice(0, 4).join(', ')}`);
    }

    // 2. Check Burstiness / Sentence Length Variance
    const burstiness = this.computeBurstinessCV(clean);
    if (burstiness.sentenceCount >= 3) {
      if (burstiness.cv < 0.32) {
        aiScore += 45;
        flaggedReasons.push(`Critically low sentence burstiness (CV: ${burstiness.cv}) — uniform AI cadence`);
      } else if (burstiness.cv < 0.45) {
        aiScore += 25;
        flaggedReasons.push(`Moderate sentence burstiness (CV: ${burstiness.cv})`);
      } else if (burstiness.cv >= 0.60) {
        aiScore -= 20; // high human variance reward
      }

      // Check consecutive sentence length uniformity (AI symptom)
      const uniformConsecutive = burstiness.consecutiveDeltas.filter((d) => d <= 2).length;
      if (uniformConsecutive >= 2 && burstiness.sentenceCount >= 4) {
        aiScore += 18;
        flaggedReasons.push(`Consecutive sentences have identical lengths (${uniformConsecutive} pairs)`);
      }
    }

    // 3. Check Sentence Opener Repetition (-ing participials or repeated first words)
    const rawSentences = splitIntoSentences(clean);
    const openers = rawSentences.map((s) => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
    const participialOpeners = openers.filter((op) => op.endsWith('ing')).length;
    if (participialOpeners >= 2 && rawSentences.length <= 6) {
      aiScore += 15;
      flaggedReasons.push(`Overuse of participial '-ing' openers (${participialOpeners} occurrences)`);
    }

    // 4. Contractions Check (humans naturally use contractions in standard English)
    const hasContractions = /\b(it's|don't|can't|won't|didn't|doesn't|they're|we're|you're|that's|wasn't|here's|there's)\b/i.test(clean);
    const hasStiffForms = /\b(it is|do not|cannot|does not|did not|they are|we are|was not)\b/i.test(clean);
    if (!hasContractions && hasStiffForms && wordCount > 40) {
      aiScore += 12;
      flaggedReasons.push('Complete absence of natural contractions');
    } else if (hasContractions) {
      aiScore -= 10; // human reward
    }

    // Clamp score
    const finalAiScore = Math.max(5, Math.min(98, Math.round(aiScore)));
    const humanScore = 100 - finalAiScore;
    const isHuman = finalAiScore <= 20;

    return {
      aiLikelihood: finalAiScore,
      humanLikelihood: humanScore,
      isHuman,
      flaggedReasons,
      burstinessCV: burstiness.cv,
      fillersFound: fillers,
    };
  }

  /**
   * Extract protected content that MUST be preserved across rewrites
   */
  static extractProtectedContent(text = '') {
    // 1. URLs
    const urlRegex = /https?:\/\/[^\s"'<>)\]]+/gi;
    const urls = Array.from(new Set(text.match(urlRegex) || []));

    // 2. Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const emails = Array.from(new Set(text.match(emailRegex) || []));

    // 3. Numbers, percentages, currencies, dates
    const numberRegex = /(?:\$|€|£|¥)?\b\d+(?:,\d{3})*(?:\.\d+)?%?/gi;
    const numbers = Array.from(new Set((text.match(numberRegex) || []).map((n) => n.trim()).filter(Boolean)));

    // 4. Citations (e.g. (Smith et al., 2020), [1], [1-3], (Author, 2023, p. 45))
    const citationRegex = /\[\d+(?:[-–,\s\d]+)?\]|\([A-Z][A-Za-z\s]+(?:et\s+al\.?)?,?\s*(?:19|20)\d{2}(?:,\s*p+\.?\s*\d+)?\)/g;
    const citations = Array.from(new Set(text.match(citationRegex) || []));

    // 5. Code blocks (inline `...` and fenced ```...```)
    const codeFenceRegex = /```[\s\S]*?```/g;
    const inlineCodeRegex = /`[^`]+`/g;
    const codeBlocks = Array.from(new Set([
      ...(text.match(codeFenceRegex) || []),
      ...(text.match(inlineCodeRegex) || []),
    ]));

    // 6. Quoted text
    const quoteRegex = /"([^"\n]{3,})"/g;
    const quotes = [];
    let qMatch;
    while ((qMatch = quoteRegex.exec(text)) !== null) {
      quotes.push(qMatch[1].trim());
    }

    // 7. Proper nouns / capitalized entities (e.g., Centurion University, Google, NASA)
    const properNounRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const rawProperNouns = text.match(properNounRegex) || [];
    const properNouns = Array.from(
      new Set(
        rawProperNouns.filter(
          (pn) =>
            !/^(The|A|An|This|That|These|Those|In|On|At|For|To|With|And|Or|But|However|Moreover|Furthermore)$/i.test(
              pn
            )
        )
      )
    ).slice(0, 15);

    return {
      urls,
      emails,
      numbers,
      citations,
      codeBlocks,
      quotes,
      properNouns,
      totalProtectedItems:
        urls.length + emails.length + numbers.length + citations.length + codeBlocks.length + quotes.length,
    };
  }

  /**
   * Find repeated 2-gram and 3-gram phrases
   */
  static findRepeatedPhrases(words) {
    if (words.length < 6) return [];
    const counts = new Map();

    for (let i = 0; i < words.length - 2; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      const w3 = words[i + 2];

      if (!this.STOP_WORDS.has(w1) || !this.STOP_WORDS.has(w2) || !this.STOP_WORDS.has(w3)) {
        const phrase = `${w1} ${w2} ${w3}`;
        counts.set(phrase, (counts.get(phrase) || 0) + 1);
      }
    }

    const repeated = [];
    for (const [phrase, count] of counts.entries()) {
      if (count > 1) {
        repeated.push({ phrase, count });
      }
    }

    return repeated.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  /**
   * Estimate syllables in word list
   */
  static estimateSyllables(words) {
    let total = 0;
    for (const word of words) {
      const w = word.toLowerCase().replace(/[^a-z]/g, '');
      if (!w) continue;
      if (w.length <= 3) {
        total += 1;
        continue;
      }
      const matches = w.match(/[aeiouy]{1,2}/g);
      let count = matches ? matches.length : 1;
      if (w.endsWith('e') && !w.endsWith('le')) {
        count--;
      }
      total += Math.max(1, count);
    }
    return Math.max(1, total);
  }

  static computeFleschEase(words, sentences, syllables) {
    if (words === 0 || sentences === 0) return 100;
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static computeFleschKincaidGrade(words, sentences, syllables) {
    if (words === 0 || sentences === 0) return 1;
    const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    return Math.max(1, Math.min(18, Number(grade.toFixed(1))));
  }

  static emptyAnalysis() {
    return {
      wordCount: 0,
      charCount: 0,
      charCountNoSpaces: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      minSentenceLength: 0,
      maxSentenceLength: 0,
      burstinessScore: 0,
      sentenceLengths: [],
      shortSentencesCount: 0,
      longSentencesCount: 0,
      vocabularyRichness: 0,
      fleschReadingEase: 100,
      approximateGradeLevel: 1,
      repeatedPhrases: [],
      protectedContent: {
        urls: [],
        emails: [],
        numbers: [],
        citations: [],
        codeBlocks: [],
        quotes: [],
        properNouns: [],
        totalProtectedItems: 0,
      },
    };
  }
}

export default TextAnalyzer;
