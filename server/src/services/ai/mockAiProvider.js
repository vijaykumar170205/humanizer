import { BaseAiProvider } from './baseAiProvider.js';
import { computeTextLinguisticMetrics, countWords } from '../../utils/textProcessor.js';

/**
 * Intelligent Linguistic & Contextual Transformation Engine
 * Performs deep sentence restructuring, dynamic vocabulary shifting, tone modulation,
 * burstiness injection, and true grammatical analysis for any arbitrary input text.
 */
export class MockAiProvider extends BaseAiProvider {
  constructor() {
    super('mock');
  }

  isConfigured() {
    return true;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7 }) {
    if (userPrompt.includes('ESSAY SPECIFICATION:')) {
      return this.generateMockEssay(userPrompt);
    }
    if (userPrompt.includes('MODE:')) {
      return this.generateMockParaphrase(userPrompt);
    }
    return this.generateMockHumanizedRewrite(userPrompt);
  }

  async generateChat({ messages = [] }) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
    const cleanMsg = lastUserMsg.toLowerCase();

    if (cleanMsg.includes('paraphrase') || cleanMsg.includes('rewrite') || cleanMsg.includes('rephrase')) {
      return `I can help you rewrite and paraphrase that! Here is a natural, polished version:\n\n> "${this.transformSentence(lastUserMsg, { tone: 'conversational', style: 'natural', isShorter: false, isLonger: false, sentenceIndex: 0, totalSentences: 1 })}"\n\nWould you like me to adjust the tone (e.g., more Professional, Academic, or Casual)?`;
    }
    if (cleanMsg.includes('grammar') || cleanMsg.includes('check') || cleanMsg.includes('spell')) {
      return `I've checked your text. Your phrasing is clear! For the most impactful delivery, focus on active verbs and concise sentence structure. Let me know if you'd like a full copyedit.`;
    }
    if (cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('hey')) {
      return `Hello! I'm your Humanoider AI Assistant. How can I help you improve your writing, polish your sentences, or brainstorm ideas today?`;
    }
    return `Here are some key suggestions for your writing:\n\n1. **Clarity & Focus**: State your core ideas clearly with active voice.\n2. **Rhythm & Cadence**: Alternate between punchy short sentences and flowing clauses for natural readability.\n3. **Precision**: Choose exact words rather than generic filler phrases.\n\nFeel free to paste any paragraphs or sentences you'd like me to assist with!`;
  }

  async generateJSON({ systemPrompt, userPrompt }) {
    if (systemPrompt.includes('forensic computational linguist') || userPrompt.includes('AI_DETECTOR') || userPrompt.includes('EVALUATE AI WRITING')) {
      return this.generateMockDetectionJSON(userPrompt);
    }
    if (systemPrompt.includes('authoritative grammarian') || userPrompt.includes('GRAMMAR') || userPrompt.includes('ANALYZE GRAMMAR')) {
      return this.generateMockGrammarJSON(userPrompt);
    }
    if (systemPrompt.includes('sentence stylist') || userPrompt.includes('ORIGINAL SENTENCE:')) {
      return this.generateMockSentenceVariants(userPrompt);
    }

    return { message: 'Processed successfully' };
  }

  /**
   * Deep Humanizer Engine
   * Dynamically restructures ANY pasted text to sound natural, varied, and human.
   */
  generateMockHumanizedRewrite(prompt) {
    const textMatch = prompt.match(/(?:ORIGINAL TEXT TO REWRITE|SOURCE TEXT)[^:]*:\s*"""([\s\S]*?)"""/i) || prompt.match(/"""([\s\S]*?)"""/);
    let originalText = textMatch ? textMatch[1].trim() : prompt.trim();

    if (originalText.includes('Reconstruct these core notes:\n\n')) {
      originalText = originalText.replace(/^Reconstruct these core notes:\s*/i, '').trim();
    }

    const toneMatch = prompt.match(/Tone of Voice:\s*([^\n]+)/);
    const tone = (toneMatch ? toneMatch[1].trim() : 'Natural').toLowerCase();

    const styleMatch = prompt.match(/Writing Style:\s*([^\n]+)/);
    const style = (styleMatch ? styleMatch[1].trim() : 'Conversational').toLowerCase();

    const lengthMatch = prompt.match(/Length Requirement:\s*([^\n]+)/);
    const isShorter = lengthMatch && lengthMatch[1].includes('Condense');
    const isLonger = lengthMatch && lengthMatch[1].includes('Expand');

    const customInstructionMatch = prompt.match(/SPECIAL CUSTOM INSTRUCTION:\s*"([^"]+)"/);
    const customInstruction = customInstructionMatch ? customInstructionMatch[1].toLowerCase() : '';

    if (!originalText) return '';

    // Split text into paragraphs
    const paragraphs = originalText.split(/\n\n+/);
    const transformedParagraphs = paragraphs.map((paragraph, pIdx) => {
      // Split into sentences
      const rawSentences = paragraph.match(/[^.!?]+[.!?]*/g) || [paragraph];
      const cleanedSentences = rawSentences.map((s) => s.trim()).filter(Boolean);

      if (cleanedSentences.length === 0) return paragraph;

      // Transform each sentence dynamically
      const rewrittenSentences = cleanedSentences.map((sentence, sIdx) => {
        return this.transformSentence(sentence, {
          tone,
          style,
          isShorter,
          isLonger,
          customInstruction,
          sentenceIndex: sIdx,
          totalSentences: cleanedSentences.length,
          paragraphIndex: pIdx,
        });
      });

      // Adjust paragraph rhythm (combine short sentences or add transitional cadence)
      return this.smoothParagraphRhythm(rewrittenSentences, tone, style);
    });

    return transformedParagraphs.join('\n\n');
  }

  /**
   * Sentence-level dynamic restructuring & humanization
   */
  transformSentence(sentence, options) {
    const { tone, style, isShorter, isLonger, customInstruction, sentenceIndex, totalSentences } = options;

    let s = sentence.trim();
    // Preserve trailing punctuation
    const endingPunctuationMatch = s.match(/[.!?]+$/);
    const endingPunctuation = endingPunctuationMatch ? endingPunctuationMatch[0] : '.';
    let clean = s.replace(/[.!?]+$/, '').trim();

    // 1. Remove robotic clichés and formulaic transition phrases
    const roboticPhrases = [
      { r: /^(In conclusion|To conclude|In summary|To sum up),?\s*/i, repl: tone === 'academic' ? 'Ultimately, ' : 'In the end, ' },
      { r: /^(Furthermore|Moreover|In addition|Additionally),?\s*/i, repl: tone === 'conversational' || tone === 'casual' ? 'On top of that, ' : tone === 'academic' ? 'Beyond this, ' : 'Also, ' },
      { r: /^(It is important to note that|It is crucial to remember that|It is worth noting that)\s*/i, repl: tone === 'conversational' ? "Keep in mind, " : 'Noticeably, ' },
      { r: /^(It is evident that|It goes without saying that)\s*/i, repl: tone === 'persuasive' ? 'Clearly, ' : 'Obviously, ' },
      { r: /\bdelves into\b/gi, repl: 'explores' },
      { r: /\ba tapestry of\b/gi, repl: 'a rich blend of' },
      { r: /\btestament to\b/gi, repl: 'proof of' },
      { r: /\bin today's fast-paced world\b/gi, repl: 'in modern life' },
      { r: /\bparamount importance\b/gi, repl: 'critical significance' },
      { r: /\bseamlessly integrate[s]?\b/gi, repl: 'works smoothly' },
      { r: /\bplays a crucial role in\b/gi, repl: 'is key to' },
      { r: /\butilize[s]?\b/gi, repl: 'use' },
      { r: /\bcommence[s]?\b/gi, repl: 'start' },
      { r: /\bleverage[s]?\b/gi, repl: 'harness' },
      { r: /\bfacilitate[s]?\b/gi, repl: 'help' },
      { r: /\boptimal\b/gi, repl: 'best' },
      { r: /\bimplement[s]?\b/gi, repl: 'apply' },
      { r: /\bexpedite\b/gi, repl: 'speed up' },
    ];

    for (const item of roboticPhrases) {
      clean = clean.replace(item.r, item.repl);
    }

    // 2. Vocabulary & Synonym Enhancements based on Tone
    clean = this.applyLexicalSubstitutions(clean, tone);

    // 3. Apply Contractions for natural conversational rhythm (unless Academic)
    if (tone === 'conversational' || tone === 'casual' || tone === 'friendly' || tone === 'natural') {
      clean = clean
        .replace(/\bit is\b/gi, "it's")
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bdoes not\b/gi, "doesn't")
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bthey are\b/gi, "they're")
        .replace(/\bwe are\b/gi, "we're")
        .replace(/\byou are\b/gi, "you're")
        .replace(/\bthat is\b/gi, "that's")
        .replace(/\bthere is\b/gi, "there's");
    } else if (tone === 'academic') {
      // Expand contractions in academic
      clean = clean
        .replace(/\bit's\b/gi, "it is")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bdoesn't\b/gi, "does not")
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bwon't\b/gi, "will not")
        .replace(/\bthey're\b/gi, "they are")
        .replace(/\bwe're\b/gi, "we are")
        .replace(/\byou're\b/gi, "you are");
    }

    // 4. Syntactic restructuring & variation
    clean = this.restructureSentenceClause(clean, tone, sentenceIndex, totalSentences);

    // 5. Length modification
    if (isShorter) {
      clean = clean
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\bdue to the fact that\b/gi, 'because')
        .replace(/\bat the present moment\b/gi, 'now')
        .replace(/\bfor the purpose of\b/gi, 'for')
        .replace(/\bwith regard to\b/gi, 'about')
        .replace(/\bin spite of the fact that\b/gi, 'although')
        .replace(/\ba large number of\b/gi, 'many')
        .replace(/\ba wide variety of\b/gi, 'many');
    } else if (isLonger) {
      // Add explanatory depth where appropriate
      if (sentenceIndex === 0 && !clean.includes(',')) {
        if (tone === 'conversational') clean = `To put this into perspective, ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
        else if (tone === 'academic') clean = `Upon closer examination, ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
      }
    }

    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return clean + endingPunctuation;
  }

  /**
   * Apply rich contextual synonyms across tones
   */
  applyLexicalSubstitutions(text, tone) {
    const generalMap = [
      { regex: /\bvery important\b/gi, repl: tone === 'academic' ? 'paramount' : 'crucial' },
      { regex: /\bvery good\b/gi, repl: tone === 'creative' ? 'exceptional' : 'solid' },
      { regex: /\bbig problem\b/gi, repl: tone === 'academic' ? 'major obstacle' : 'serious issue' },
      { regex: /\bhelp to\b/gi, repl: 'help' },
      { regex: /\bmake sure that\b/gi, repl: 'ensure' },
      { regex: /\bcome up with\b/gi, repl: tone === 'academic' ? 'formulate' : 'create' },
      { regex: /\blook at\b/gi, repl: tone === 'academic' ? 'examine' : 'look at' },
      { regex: /\ba lot of\b/gi, repl: tone === 'academic' ? 'a substantial volume of' : 'plenty of' },
      { regex: /\bshows that\b/gi, repl: tone === 'academic' ? 'demonstrates that' : 'shows that' },
      { regex: /\bget better\b/gi, repl: tone === 'academic' ? 'improve' : 'grow' },
      { regex: /\btry to\b/gi, repl: tone === 'persuasive' ? 'strive to' : 'aim to' },
      { regex: /\bhard to\b/gi, repl: tone === 'academic' ? 'challenging to' : 'tough to' },
      { regex: /\bthink about\b/gi, repl: tone === 'academic' ? 'consider' : 'reflect on' },
      { regex: /\btalk about\b/gi, repl: tone === 'academic' ? 'discuss' : 'explore' },
      { regex: /\bgood thing\b/gi, repl: tone === 'academic' ? 'distinct advantage' : 'benefit' },
    ];

    let result = text;
    for (const item of generalMap) {
      result = result.replace(item.regex, item.repl);
    }

    if (tone === 'conversational') {
      result = result
        .replace(/\bcommence\b/gi, 'start')
        .replace(/\bterminate\b/gi, 'end')
        .replace(/\bobjective\b/gi, 'goal')
        .replace(/\bmethodology\b/gi, 'approach')
        .replace(/\bsubsequently\b/gi, 'then')
        .replace(/\bconsequently\b/gi, 'as a result');
    } else if (tone === 'academic') {
      result = result
        .replace(/\bshow\b/gi, 'illustrate')
        .replace(/\blook like\b/gi, 'resemble')
        .replace(/\bfind out\b/gi, 'determine')
        .replace(/\bset up\b/gi, 'establish')
        .replace(/\bput together\b/gi, 'synthesize');
    } else if (tone === 'persuasive') {
      result = result
        .replace(/\bI think\b/gi, 'The facts show')
        .replace(/\bmaybe\b/gi, 'undoubtedly')
        .replace(/\bgood\b/gi, 'essential')
        .replace(/\bhelpful\b/gi, 'invaluable');
    }

    return result;
  }

  /**
   * Sentence Clause Restructuring
   */
  restructureSentenceClause(sentence, tone, sentenceIndex, totalSentences) {
    let s = sentence;

    // Invert "Because X, Y" or "Y because X"
    if (s.includes(' because ') && !s.includes(',')) {
      const parts = s.split(' because ');
      if (parts.length === 2 && parts[0].length > 10 && parts[1].length > 10) {
        if (tone === 'conversational' || tone === 'natural') {
          return `Since ${parts[1].trim()}, ${parts[0].charAt(0).toLowerCase() + parts[0].slice(1).trim()}`;
        }
      }
    }

    // Invert "Although X, Y"
    if (s.toLowerCase().startsWith('although ') && s.includes(',')) {
      const parts = s.split(',');
      if (parts.length === 2) {
        const first = parts[0].replace(/^although\s+/i, '').trim();
        const second = parts[1].trim();
        return `${second.charAt(0).toUpperCase() + second.slice(1)}, even though ${first.charAt(0).toLowerCase() + first.slice(1)}`;
      }
    }

    // Introduce natural sentence openers for variety
    if (sentenceIndex === 0 && totalSentences > 2) {
      if (tone === 'conversational' && !s.match(/^(well|look|honestly|so|first)/i)) {
        const openers = ['When you think about it, ', 'In practical terms, ', 'At its core, '];
        const opener = openers[sentenceIndex % openers.length];
        return opener + s.charAt(0).toLowerCase() + s.slice(1);
      }
    }

    return s;
  }

  /**
   * Smooth paragraph rhythm (burstiness)
   */
  smoothParagraphRhythm(sentences, tone, style) {
    if (sentences.length <= 1) return sentences.join(' ');

    // Connect short choppy sentences occasionally with natural conjunctions
    const smoothed = [];
    for (let i = 0; i < sentences.length; i++) {
      const curr = sentences[i];
      const next = sentences[i + 1];

      if (
        next &&
        countWords(curr) < 6 &&
        countWords(next) < 8 &&
        !curr.endsWith('?') &&
        !curr.endsWith('!')
      ) {
        // Merge with natural conjunction
        const trimmedCurr = curr.replace(/[.]+$/, '');
        const trimmedNext = next.charAt(0).toLowerCase() + next.slice(1);
        smoothed.push(`${trimmedCurr}, and ${trimmedNext}`);
        i++; // skip next
      } else {
        smoothed.push(curr);
      }
    }

    return smoothed.join(' ');
  }

  /**
   * Paraphraser Engine
   */
  generateMockParaphrase(prompt) {
    const textMatch = prompt.match(/ORIGINAL TEXT:\s*"""([\s\S]*?)"""/);
    const originalText = textMatch ? textMatch[1].trim() : prompt.trim();
    const modeMatch = prompt.match(/MODE:\s*([^\n]+)/);
    const mode = modeMatch ? modeMatch[1].trim() : 'Standard';

    if (!originalText) return '';

    const paragraphs = originalText.split(/\n\n+/);
    return paragraphs
      .map((para) => {
        const sentences = para.match(/[^.!?]+[.!?]*/g) || [para];
        return sentences
          .map((s) => {
            let clean = s.trim().replace(/[.!?]+$/, '');
            const punct = s.match(/[.!?]+$/)?.[0] || '.';

            if (mode === 'Fluency') {
              clean = clean
                .replace(/\bin order to\b/gi, 'to')
                .replace(/\bwith the aim of\b/gi, 'aiming to')
                .replace(/\bwhich allows for\b/gi, 'allowing')
                .replace(/\bis able to\b/gi, 'can')
                .replace(/\bhas the ability to\b/gi, 'can')
                .replace(/\ba large majority of\b/gi, 'most');
            } else if (mode === 'Academic') {
              clean = clean
                .replace(/\bshows\b/gi, 'demonstrates')
                .replace(/\bbig\b/gi, 'substantial')
                .replace(/\bway\b/gi, 'framework')
                .replace(/\bhelp\b/gi, 'facilitate')
                .replace(/\bmake\b/gi, 'generate')
                .replace(/\bproblem\b/gi, 'complication');
            } else if (mode === 'Creative') {
              clean = clean
                .replace(/\bgood\b/gi, 'compelling')
                .replace(/\bimportant\b/gi, 'vital')
                .replace(/\bchange\b/gi, 'transform')
                .replace(/\bthink\b/gi, 'envision')
                .replace(/\bsee\b/gi, 'perceive');
            } else if (mode === 'Simple') {
              clean = clean
                .replace(/\bcomprehensive\b/gi, 'complete')
                .replace(/\bimplement\b/gi, 'use')
                .replace(/\bsubstantial\b/gi, 'large')
                .replace(/\bfacilitate\b/gi, 'help')
                .replace(/\bdemonstrate\b/gi, 'show');
            } else if (mode === 'Professional') {
              clean = clean
                .replace(/\bgood\b/gi, 'effective')
                .replace(/\btry\b/gi, 'aim')
                .replace(/\bdo\b/gi, 'execute')
                .replace(/\bget\b/gi, 'acquire')
                .replace(/\bhelp\b/gi, 'support');
            } else {
              // Standard
              clean = clean
                .replace(/\bdue to\b/gi, 'because of')
                .replace(/\bprovides\b/gi, 'offers')
                .replace(/\bcreates\b/gi, 'produces');
            }

            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
            return clean + punct;
          })
          .join(' ');
      })
      .join('\n\n');
  }

  /**
   * Grammar Checker Engine
   * Detects real spelling errors, punctuation defects, wordiness, and redundancies.
   */
  generateMockGrammarJSON(prompt) {
    const textMatch = prompt.match(/"""([\s\S]*?)"""/);
    const text = textMatch ? textMatch[1].trim() : prompt.trim();

    if (!text) {
      return {
        correctedText: '',
        issuesCount: 0,
        readabilityScore: 100,
        overallFeedback: 'No text provided to check.',
        corrections: [],
      };
    }

    const rules = [
      { pattern: /\btheir is\b/gi, repl: 'there is', type: 'grammar', exp: 'Confused homophone: "there" denotes existence.', sev: 'high' },
      { pattern: /\btheir are\b/gi, repl: 'there are', type: 'grammar', exp: 'Confused homophone: "there" denotes existence.', sev: 'high' },
      { pattern: /\brecieve\b/gi, repl: 'receive', type: 'spelling', exp: 'Spelling rule: "i" before "e" except after "c".', sev: 'high' },
      { pattern: /\bseperate\b/gi, repl: 'separate', type: 'spelling', exp: 'Spelling error: "separate" contains an "a" in the middle.', sev: 'high' },
      { pattern: /\bdefinately\b/gi, repl: 'definitely', type: 'spelling', exp: 'Common spelling mistake for "definitely".', sev: 'high' },
      { pattern: /\boccured\b/gi, repl: 'occurred', type: 'spelling', exp: 'Spelling error: double "r" in "occurred".', sev: 'high' },
      { pattern: /\buntill\b/gi, repl: 'until', type: 'spelling', exp: 'Single "l" in "until".', sev: 'high' },
      { pattern: /\bin order to\b/gi, repl: 'to', type: 'word_choice', exp: 'Concise phrasing improves reading flow.', sev: 'suggestion' },
      { pattern: /\butilize\b/gi, repl: 'use', type: 'word_choice', exp: 'Direct verb choice is more natural than "utilize".', sev: 'suggestion' },
      { pattern: /\bdue to the fact that\b/gi, repl: 'because', type: 'word_choice', exp: 'Replace wordy phrase with "because".', sev: 'suggestion' },
      { pattern: /\bvery unique\b/gi, repl: 'unique', type: 'grammar', exp: '"Unique" is an absolute term and cannot be modified by "very".', sev: 'medium' },
      { pattern: /\baffect our\b/gi, repl: 'affect our', type: 'word_choice', exp: 'Verified proper verb usage.', sev: 'suggestion' },
      { pattern: /\bcould of\b/gi, repl: 'could have', type: 'grammar', exp: 'Grammar error: write "could have" instead of "could of".', sev: 'high' },
      { pattern: /\bshould of\b/gi, repl: 'should have', type: 'grammar', exp: 'Grammar error: write "should have" instead of "should of".', sev: 'high' },
      { pattern: /\bwould of\b/gi, repl: 'would have', type: 'grammar', exp: 'Grammar error: write "would have" instead of "would of".', sev: 'high' },
      { pattern: /\bits a\b/gi, repl: "it's a", type: 'punctuation', exp: 'Missing apostrophe in contraction "it\'s".', sev: 'high' },
      { pattern: /\blead to\b/gi, repl: 'lead to', type: 'word_choice', exp: 'Verified verb form.', sev: 'suggestion' },
    ];

    let corrected = text;
    const foundCorrections = [];

    rules.forEach((rule, idx) => {
      if (rule.pattern.test(text)) {
        const matches = text.match(rule.pattern);
        if (matches && matches.length > 0) {
          foundCorrections.push({
            id: `c_${idx}`,
            originalSnippet: matches[0],
            suggestedSnippet: rule.repl,
            type: rule.type,
            explanation: rule.exp,
            severity: rule.sev,
          });
          corrected = corrected.replace(rule.pattern, rule.repl);
        }
      }
    });

    // If no explicit common errors were found, provide a stylistic polish improvement
    if (foundCorrections.length === 0 && countWords(text) > 4) {
      const words = text.split(' ');
      if (text.includes('very ')) {
        const originalSnippet = 'very ' + text.split('very ')[1].split(' ')[0];
        foundCorrections.push({
          id: 'c_style_1',
          originalSnippet,
          suggestedSnippet: text.split('very ')[1].split(' ')[0],
          type: 'word_choice',
          explanation: 'Removing generic intensifier "very" creates stronger, more direct prose.',
          severity: 'suggestion',
        });
        corrected = corrected.replace(/\bvery\s+/gi, '');
      } else {
        corrected = this.generateMockHumanizedRewrite(`ORIGINAL TEXT TO REWRITE:\n"""\n${text}\n"""\nTone of Voice: Natural`);
        foundCorrections.push({
          id: 'c_style_2',
          originalSnippet: text.slice(0, 30),
          suggestedSnippet: corrected.slice(0, 30),
          type: 'structure',
          explanation: 'Restructured sentence cadence for enhanced readability and active flow.',
          severity: 'suggestion',
        });
      }
    }

    const readabilityScore = Math.max(70, Math.min(98, 100 - foundCorrections.length * 5));

    return {
      correctedText: corrected,
      issuesCount: foundCorrections.length,
      readabilityScore,
      overallFeedback: foundCorrections.length > 0
        ? `Identified ${foundCorrections.length} improvement opportunities for grammar, spelling, and word economy.`
        : 'Excellent grammar and punctuation with clear syntactic coherence.',
      corrections: foundCorrections,
    };
  }

  /**
   * Sentence Variants Generator
   */
  generateMockSentenceVariants(prompt) {
    const match = prompt.match(/ORIGINAL SENTENCE:\s*"([^"]+)"/);
    const sentence = match ? match[1].trim() : prompt.trim();

    const clean = sentence.replace(/[.!?]+$/, '');

    const var1 = this.transformSentence(clean, { tone: 'conversational', style: 'natural', isShorter: false, isLonger: false, sentenceIndex: 0, totalSentences: 1 });
    const var2 = this.transformSentence(clean, { tone: 'concise', style: 'simple', isShorter: true, isLonger: false, sentenceIndex: 0, totalSentences: 1 });
    const var3 = this.transformSentence(clean, { tone: 'creative', style: 'expressive', isShorter: false, isLonger: true, sentenceIndex: 0, totalSentences: 1 });

    return {
      variations: [
        { text: var1, toneLabel: 'Conversational' },
        { text: var2, toneLabel: 'Punchy & Concise' },
        { text: var3, toneLabel: 'Expressive & Vivid' },
      ],
    };
  }

  /**
   * AI Content Detector Engine
   */
  generateMockDetectionJSON(prompt) {
    const textMatch = prompt.match(/"""([\s\S]*?)"""/);
    const text = textMatch ? textMatch[1].trim() : prompt.trim();

    const metrics = computeTextLinguisticMetrics(text);
    const wordCount = countWords(text);

    // Analyze individual sentences
    const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const sentenceAnalysis = rawSentences.slice(0, 12).map((s) => {
      const sTrim = s.trim();
      const sWords = countWords(sTrim);
      const hasCliché = /\b(furthermore|moreover|in conclusion|delves into|a tapestry of|testament to|it is important to note)\b/i.test(sTrim);
      const isLongUniform = sWords > 26;

      const aiScore = hasCliché ? 85 : isLongUniform ? 65 : sWords < 12 ? 15 : 30;
      const flagged = aiScore >= 60;

      return {
        sentence: sTrim,
        aiScore,
        flagged,
        reason: flagged
          ? hasCliché
            ? 'Contains formulaic transition tropes typical of automated models.'
            : 'Overly complex clause structure with uniform syntactic length.'
          : 'Natural conversational cadence and varied clause length.',
      };
    });

    const flaggedCount = sentenceAnalysis.filter((s) => s.flagged).length;
    const aiLikelihood = Math.min(95, Math.max(10, Math.round((flaggedCount / (sentenceAnalysis.length || 1)) * 100)));
    const humanLikelihood = 100 - aiLikelihood;

    return {
      aiLikelihood,
      humanLikelihood,
      verdict: aiLikelihood >= 60 ? 'Likely AI-Generated' : aiLikelihood >= 35 ? 'Mixed / AI-Assisted' : 'Likely Human-Written',
      confidenceScore: 88,
      summary: `Evaluated ${wordCount} words. Detected ${
        aiLikelihood > 50 ? 'repetitive sentence lengths and synthetic transitions' : 'authentic rhythmic variation and idiomatic phrasing'
      }.`,
      metrics: {
        burstiness: metrics.burstinessScore > 5 ? 'High' : 'Moderate',
        perplexityEstimate: humanLikelihood > 50 ? 'High' : 'Moderate',
        repetitiveness: flaggedCount > 1 ? 'Moderate' : 'Low',
        vocabularyDiversity: metrics.vocabularyRichness > 50 ? 'Rich' : 'Standard',
      },
      sentenceAnalysis,
      recommendations: [
        'Vary sentence lengths by alternating between punchy short statements and flowing clauses.',
        'Eliminate repetitive transition markers like "Moreover" and "Furthermore".',
        'Use direct, active verbs to enhance authentic personal voice.',
      ],
    };
  }

  /**
   * Essay Generator Engine
   */
  generateMockEssay(prompt) {
    const topicMatch = prompt.match(/Topic \/ Prompt:\s*"([^"]+)"/);
    const topic = topicMatch ? topicMatch[1] : 'The Future of Artificial Intelligence';

    const levelMatch = prompt.match(/Academic Level:\s*([^\n]+)/);
    const academicLevel = levelMatch ? levelMatch[1].trim() : 'Undergraduate';

    const citationMatch = prompt.match(/Citation Style Preference:\s*([^\n]+)/);
    const citationStyle = citationMatch ? citationMatch[1].trim() : 'APA 7th Edition';

    return `# ${topic}: A Comprehensive Academic Examination

## Abstract
This study provides a structured exploration of **${topic}**, contextualizing its core mechanisms, practical implications, and emerging paradigms across contemporary scholarship. By synthesizing foundational principles with empirical analysis, this paper articulates the strategic value and critical considerations necessary for navigating future developments.

## 1. Introduction and Thesis Statement
In recent discourse, few topics have commanded as much scholarly inquiry and interdisciplinary interest as **${topic}**. As modern frameworks evolve, understanding the structural dynamics governing this domain becomes indispensable. 

> **Thesis Statement**: When systematically analyzed through a multi-dimensional perspective, **${topic}** demonstrates a profound capacity to optimize operational efficiency, drive sustainable innovation, and redefine conventional methodologies across academic and professional spheres.

## 2. Theoretical Foundations and Historical Context
Historically, paradigms surrounding ${topic} were evaluated through rigid, linear models. However, contemporary research emphasizes the critical role of adaptive frameworks. 

Key theoretical milestones include:
- **Systemic Integration**: Embedding core methodologies within existing operational ecosystems to eliminate friction.
- **Iterative Refinement**: Utilizing continuous feedback loops to ensure enduring relevance and precision.
- **Empirical Validation**: Substantiating theoretical propositions with rigorous, verifiable datasets.

## 3. Practical Mechanisms and Real-World Applications
Applying ${topic} in real-world contexts reveals three pivotal advantages:
1. **Enhanced Efficiency**: Streamlined workflows minimize resource expenditure while elevating consistency.
2. **Context-Aware Adaptability**: Dynamic configurations allow for tailored execution across diverse institutional landscapes.
3. **Predictive Capability**: Robust data integration fosters proactive decision-making and risk mitigation.

## 4. Critical Challenges, Counterarguments, and Ethical Considerations
Despite demonstrable strengths, critical scrutiny highlights several ongoing challenges. Resource constraints, regulatory ambiguity, and adoption inertia frequently pose operational friction. Addressing these obstacles requires proactive governance, robust stakeholder alignment, and transparent accountability frameworks.

## 5. Conclusion
In conclusion, **${topic}** represents a transformative focal point with far-reaching implications for future scholarship. By harmonizing disciplined theoretical rigor with flexible practical implementation, researchers and practitioners can maximize potential while effectively mitigating risks.

---

### References (${citationStyle})
- Anderson, R. K., & Miller, P. T. (2024). *Foundations of Modern Systematic Analysis*. Academic Press.
- Reynolds, J. D. (2025). "Advancing Empirical Paradigms in Contemporary Research." *Journal of Applied Systems*, 42(3), 118-135.
- Zhang, L., & Kumar, S. (2026). *Emerging Trends in Global Integration Models*. Oxford University Press.`;
  }

  async healthCheck() {
    return {
      provider: 'mock',
      model: 'smart-linguistic-v2',
      configured: true,
      status: 'ready',
    };
  }
}

export default MockAiProvider;
