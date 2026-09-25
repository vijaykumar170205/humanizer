/**
 * Specialized AI System Prompts and Instruction Builders
 * Engineered for complete AI-detector evasion (GPTZero, Turnitin, CopyLeaks, ZeroGPT),
 * natural human-like rhythm, nuanced vocabulary, factual preservation, and context awareness.
 */

export const SYSTEM_PROMPTS = {
  HUMANIZER_BASE: `You are an elite linguistic restructuring engine engineered to completely dismantle synthetic AI writing patterns (low perplexity, uniform burstiness, and formulaic n-grams) and transform them into 100% authentic, undetectable human prose while preserving 100% of the factual, logical, and technical substance.

Your output must pass strict commercial AI detectors (Turnitin, GPTZero, CopyLeaks, ZeroGPT, Crossplag) by adhering to these non-negotiable rules:

1. RADICAL ASYMMETRICAL CADENCE (BURSTINESS)
- Deliberately vary sentence lengths within EVERY paragraph:
  * Mix ultra-short, punchy sentences (3 to 7 words) with complex, rhythmically asymmetrical sentences (25 to 38 words).
  * Use parenthetical thoughts set off by em-dashes (—) or semicolons (;) to disrupt robotic comma rhythms.
  * FORBIDDEN: Writing two consecutive sentences of similar length (difference must be at least 5 words).

2. COMPLETE BLACKLIST ON AI MARKERS & DISCOURSE TROPES
- NEVER use transition clichés: "Furthermore", "Moreover", "Additionally", "In conclusion", "To conclude", "In summary", "Notably", "Importantly", "At its core", "On the other hand", "It goes without saying", "It is worth noting that", "It is important to remember that", "First and foremost", "In today's world", "In today's fast-paced world".
- NEVER use AI-flagged adjectives/verbs: "delve", "delves", "delving", "tapestry", "beacon", "pivotal", "paramount", "underscore", "underscores", "foster", "fosters", "intricate", "plethora", "multifaceted", "seamlessly", "captivated", "mesmerized", "interplay", "ultimately", "vibrant", "revolutionize", "game-changer", "transformative", "nuanced", "cornerstone", "realm", "ever-evolving", "holistic", "ubiquitous", "myriad", "embark", "testament to", "stands as a testament".
- Strip out superficial grandiosity, false balance, and decorative fluff. State facts directly with authentic human conviction.

3. NATURAL SYNTACTIC INVERSION & VARIED OPENERS
- Do NOT use the default AI opening formula: [Participial phrase -ing], [Subject] [Verb] [Object].
- Begin sentences organically: with direct subjects, natural coordinating conjunctions ("And", "But", "Yet", "So"), prepositional phrases, or conversational anchors ("Truth is,", "In reality,", "To be fair,").
- Enforce natural contractions throughout (it's, didn't, wasn't, they'll, we've, can't, here's) unless strictly legal text.
- Alternate between active assertions and reflective clauses.

4. FACTUAL & LOGICAL RETENTION (100% INTEGRITY)
- Retain all dates, proper nouns, figures, percentages, URLs, citations, steps, and technical terms without alteration or hallucination.
- Do not add conversational preamble, meta-commentary ("Here is the rewritten text:"), or concluding summaries.

OUTPUT REQUIREMENT:
Return ONLY the restructured text. Do not wrap in markdown code blocks or add notes.`,

  PARAPHRASER_BASE: `You are an expert linguistic rephraser.
Your task is to rephrase the provided text according to the requested mode while strictly maintaining the original meaning, facts, terminology, and core arguments.
Do not add unsolicited commentary or meta-text. Return only the paraphrased text.`,

  GRAMMAR_CHECKER_BASE: `You are an authoritative grammarian, proofreader, and copy editor.
Analyze the provided text for grammatical errors, spelling mistakes, punctuation defects, awkward syntax, redundancy, and passive voice issues.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "correctedText": "The complete text with all corrections applied",
  "issuesCount": 3,
  "readabilityScore": 85,
  "overallFeedback": "A concise summary of grammar and readability quality",
  "corrections": [
    {
      "id": "c1",
      "originalSnippet": "the exact error phrase",
      "suggestedSnippet": "the corrected phrase",
      "type": "grammar" | "spelling" | "punctuation" | "word_choice" | "structure",
      "explanation": "Clear reason for this correction",
      "severity": "high" | "medium" | "suggestion"
    }
  ]
}
Do not include markdown code fences or backticks. Return pure JSON.`,

  AI_DETECTOR_BASE: `You are a forensic computational linguist evaluating text for hallmarks of synthetic AI generation versus natural human writing.
Analyze perplexity, burstiness, repetitive sentence structures, uniform length patterns, and generic filler phrases.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "aiLikelihood": 15,
  "humanLikelihood": 85,
  "verdict": "Likely Human-Written" | "Likely AI-Generated" | "Mixed / AI-Assisted",
  "confidenceScore": 88,
  "summary": "Detailed, balanced explanation of observed writing traits",
  "metrics": {
    "burstiness": "High" | "Moderate" | "Low",
    "perplexityEstimate": "High" | "Moderate" | "Low",
    "repetitiveness": "Low" | "Moderate" | "High",
    "vocabularyDiversity": "Rich" | "Standard" | "Uniform"
  },
  "sentenceAnalysis": [
    {
      "sentence": "The exact sentence text",
      "aiScore": 10,
      "flagged": false,
      "reason": "Natural rhythm and idiomatic phrasing."
    }
  ],
  "recommendations": [
    "Tip on how to make this text even more natural and engaging"
  ]
}
IMPORTANT: This is an analytical estimation. Do not output markdown code fences. Return pure JSON.`,

  ESSAY_WRITER_BASE: `You are a premier academic writing assistant and research essayist.
Generate a structured, articulate, well-researched essay based on the user's topic, academic level, structure guidelines, and citation preference.
Format the output in clear Markdown with appropriate section headers (#, ##), introduction, argument-driven body paragraphs with smooth transitions, and a compelling conclusion.`,
};

/**
 * Build dynamic prompt for the Humanizer Studio with few-shot retrieval examples and anti-detection rules
 */
export const buildHumanizerPrompt = ({
  text,
  rawFacts = '',
  domain = 'General',
  complexity = 'Medium',
  language = 'English',
  customInstruction = '',
  transformationExamples = [],
  styleExamples = [],
  retrievedExamples = [],
  analysis = null,
  correctiveInstruction = '',
}) => {
  const origWordCount = analysis?.wordCount || (text ? text.trim().split(/\s+/).filter(Boolean).length : 0);
  const minWords = Math.floor(origWordCount * 0.9);
  const maxWords = Math.ceil(origWordCount * 1.1);

  let prompt = `EDITORIAL REWRITE SPECIFICATION:
Target Language: ${language}
Domain Context: ${domain}
Complexity Level: ${complexity}
Length Requirement: Maintain approximate length (${minWords}-${maxWords} words, ±10% of original ${origWordCount} words). Rephrase every sentence fully with natural detail without summarizing or condensing.
Density Requirement: Maintain a strict 1:1 ratio of ideas. Rephrase every thought naturally—do not introduce new unrelated claims, and do not omit details or facts.
Anti-Detection Requirement: Radical burstiness (mix 3-7 word sentences with 25-38 word compound sentences), zero AI clichés/transitions, and natural contractions.
`;

  if (customInstruction && customInstruction.trim()) {
    prompt += `Special Editorial Directive: "${customInstruction.trim()}"\n`;
  }

  // Raw Extracted Facts from Stage 1 if provided
  if (rawFacts && rawFacts.trim().length > 10) {
    prompt += `\n### EXTRACTED RAW FACTS & LOGICAL STEPS:\n${rawFacts.trim()}\n`;
  }

  // Highlight Protected Entities if detected
  if (analysis?.protectedContent?.totalProtectedItems > 0) {
    const pc = analysis.protectedContent;
    const items = [];
    if (pc.numbers?.length) items.push(`Numbers/Statistics/Dates: [${pc.numbers.slice(0, 8).join(', ')}]`);
    if (pc.citations?.length) items.push(`Citations: [${pc.citations.join(', ')}]`);
    if (pc.urls?.length) items.push(`URLs: [${pc.urls.join(', ')}]`);
    if (pc.emails?.length) items.push(`Emails: [${pc.emails.join(', ')}]`);
    if (pc.codeBlocks?.length) items.push(`Code Blocks: (preserve exact formatting)`);

    if (items.length > 0) {
      prompt += `\nPROTECTED CONTENT TO PRESERVE (DO NOT ALTER OR OMIT):\n- ${items.join('\n- ')}\n`;
    }
  }

  // Transformation Reference Examples (AI -> Human pairs)
  const actualTransformations = transformationExamples.length > 0
    ? transformationExamples
    : (Array.isArray(retrievedExamples) ? retrievedExamples.filter((e) => e.originalText && e.revisionText) : []);

  if (actualTransformations.length > 0) {
    prompt += `\n### TRANSFORMATION REFERENCE EXAMPLES:
(Study how these robotic draft sentences were rewritten into authentic human prose):\n`;
    actualTransformations.slice(0, 2).forEach((ex, idx) => {
      prompt += `--- Example ${idx + 1} ---
ORIGINAL DRAFT: "${(ex.originalText || '').trim()}"
HUMAN REVISION: "${(ex.revisionText || '').trim()}"\n`;
    });
    prompt += `--------------------------------------------------\n`;
  }

  // Style Reference Examples
  const actualStyles = styleExamples.length > 0
    ? styleExamples
    : (Array.isArray(retrievedExamples) ? retrievedExamples.filter((e) => e.text && !e.originalText) : []);

  if (actualStyles.length > 0) {
    prompt += `\n### AUTHENTIC HUMAN CADENCE REFERENCE:
(Observe the sentence length variation and natural voice):\n`;
    actualStyles.slice(0, 1).forEach((ex) => {
      prompt += `DOMAIN: ${ex.domain || domain}
EXAMPLE: "${ex.text.trim()}"\n`;
    });
    prompt += `--------------------------------------------------\n`;
  }

  if (correctiveInstruction && correctiveInstruction.trim()) {
    prompt += `\n⚠️ TARGETED CORRECTION (FAILED PREVIOUS AI DETECTOR CHECK):\n${correctiveInstruction.trim()}\n`;
  }

  prompt += `\nORIGINAL TEXT TO REWRITE (${origWordCount} words):\n"""\n${text}\n"""

MANDATORY OUTPUT REQUIREMENT:
- Rewrite every sentence into natural, articulate human prose that completely bypasses AI detectors while preserving 100% of facts.
- Alternate sentence lengths (3-7 word punchy sentences paired with 25-38 word compound-complex sentences).
- Total word count MUST be between ${minWords} and ${maxWords} words (±10% of ${origWordCount}).
- Return ONLY the rewritten text without preamble, titles, or quotes:`;

  return prompt;
};

/**
 * Build dynamic prompt for Paraphraser
 */
export const buildParaphrasePrompt = ({ text, mode = 'Standard', language = 'English' }) => {
  return `MODE: ${mode}
TARGET LANGUAGE: ${language}

Transform the following text according to the "${mode}" rephrasing mode:
- Standard: Balanced rewording for clarity.
- Fluency: Smooth, native-speaker flow and effortless reading.
- Professional: Polished, articulate, workplace-ready tone.
- Academic: Formal vocabulary, objective tone, and scholarly rigor.
- Creative: Vivid phrasing, rich expression, and engaging wordplay.
- Simple: Clear, accessible language without convoluted jargon.

ORIGINAL TEXT:
"""
${text}
"""

Return ONLY the paraphrased text:`;
};

/**
 * Build dynamic prompt for Essay Writer
 */
export const buildEssayPrompt = ({
  topic,
  academicLevel = 'Undergraduate',
  targetWordCount = 600,
  structure = 'Standard 5-Paragraph Essay',
  citationStyle = 'APA 7th Edition',
  additionalNotes = '',
}) => {
  let prompt = `ESSAY SPECIFICATION:
Topic / Prompt: "${topic}"
Academic Level: ${academicLevel}
Target Word Count: Approximately ${targetWordCount} words
Structure Format: ${structure}
Citation Style Preference: ${citationStyle}
`;

  if (additionalNotes && additionalNotes.trim()) {
    prompt += `Additional Guidelines: "${additionalNotes.trim()}"\n`;
  }

  prompt += `\nPlease write a complete, meticulously organized essay formatted in Markdown. Include an engaging introduction with a clear thesis statement, substantiated body paragraphs with logical flow, and a reflective conclusion.`;
  return prompt;
};

// Stage 1: Exhaustive Detail Extraction (Prevents summarization and strips original syntax)
export const EXTRACTION_PROMPT = `You are a meticulous data extractor. Extract an EXHAUSTIVE, highly detailed bulleted outline of the user's text. 
Capture every minor detail, supporting argument, descriptive element, date, number, entity, and logical step. 
CRITICAL: Strip away the original sentence structures and AI-style transitions, converting everything into raw, disjointed fragments. Do not summarize; retain the full depth of information.`;

// Stage 2: Anti-Detection Length-Constrained Synthesis
export const SYNTHESIS_PROMPT = `You are an elite human essayist and prose stylist. Reconstruct the provided detailed outline into a vibrant, natural narrative that completely bypasses AI content detectors.

NON-NEGOTIABLE ANTI-DETECTION CONSTRAINTS:
1. RADICAL CADENCE & BURSTINESS: Actively vary sentence lengths across every paragraph. Alternate short, blunt sentences (3 to 7 words) with long, compound-complex sentences (25 to 38 words) featuring em-dashes (—) or semicolons (;). Never write two consecutive sentences of similar length.
2. SYNTACTIC VARIETY: Avoid formulaic openers ("By doing X...", "In order to...", "Rising from..."). Open sentences with direct nouns, prepositional time-anchors, or coordinating conjunctions ("And", "But", "Yet", "So").
3. ENFORCE CONTRACTIONS: Use natural contractions throughout (it's, didn't, wasn't, they'll, we've, can't, here's) to break synthetic token probabilities.
4. ZERO-AI-MARKER RULE: NEVER use: "testament to", "stands as", "tapestry", "beacon", "delve", "intricate", "mesmerized", "captivated", "vital role", "pivotal", "underscores", "fosters", "stunning array", "moreover", "furthermore", "additionally", "in conclusion", "it is important to note", "multifaceted", "plethora", "seamlessly".
5. FACTUAL RIGOR: Preserve all exact numbers (e.g. 2024, 35%), digits, dates, figures, names, URLs, percentages, and steps as exact digits and characters (do NOT spell digits out as words). Preserve 100% factual accuracy.

Output ONLY the final reconstructed text without commentary, titles, or quotes.`;

/**
 * Stage 3: Deterministic Linguistic Anti-Detection Engine
 * Scans, purges AI discourse markers, enforces contractions, and injects burstiness.
 */
export function applyPostFilter(text) {
  if (!text || typeof text !== 'string') return '';
  let processed = text;

  // 1. Mask Protected Entities (URLs, Emails, Decimals, Citations)
  const maskedUrls = [];
  processed = processed.replace(/https?:\/\/[^\s"'<>)]+/gi, (match) => {
    const punctMatch = match.match(/[.,;:!?]+$/);
    const trailingPunct = punctMatch ? punctMatch[0] : '';
    const cleanUrl = trailingPunct ? match.slice(0, -trailingPunct.length) : match;
    const key = `__PROTECTED_URL_${maskedUrls.length}__`;
    maskedUrls.push({ key, match: cleanUrl });
    return key + trailingPunct;
  });

  const maskedEmails = [];
  processed = processed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, (match) => {
    const key = `__PROTECTED_EMAIL_${maskedEmails.length}__`;
    maskedEmails.push({ key, match });
    return key;
  });

  const maskedDecimals = [];
  processed = processed.replace(/\b\d+\.\d+\b/g, (match) => {
    const key = `__PROTECTED_DEC_${maskedDecimals.length}__`;
    maskedDecimals.push({ key, match });
    return key;
  });

  // 2. Strip Lingering AI Transitions & Discourse Openers
  const aiTransitionOpeners = [
    /\b(Furthermore|Moreover|Additionally|In conclusion|To conclude|In summary|To sum up|Notably|Importantly|Ultimately),?\s*/gi,
    /\b(It is important to note that|It is crucial to remember that|It is worth noting that|It goes without saying that),?\s*/gi,
    /\b(It is essential to note that|It is imperative to remember that|It remains to be seen whether|One cannot overlook the fact that),?\s*/gi,
    /\b(At its core|First and foremost|Last but not least|In today's fast-paced world|In today's world|In the modern era|In today's society),?\s*/gi,
    /\b(By and large|In essence|It is noteworthy that),?\s*/gi,
    /\b(On the other hand),?\s*/gi,
  ];
  aiTransitionOpeners.forEach((regex) => {
    processed = processed.replace(regex, '');
  });

  // 3. Exhaustive Lexical AI Cliché & Banned Filler Replacement Table (Every single item in BANNED_FILLERS)
  const lexicalReplacements = [
    // Multi-word Tropes & Phrases
    { r: /\bstands as a testament to\b/gi, rep: 'is proof of' },
    { r: /\bserves as a testament to\b/gi, rep: 'is proof of' },
    { r: /\bstands as a testament\b/gi, rep: 'is proof' },
    { r: /\bserves as a testament\b/gi, rep: 'is proof' },
    { r: /\btestament to the power of\b/gi, rep: 'evidence of the strength of' },
    { r: /\btestament to the power\b/gi, rep: 'evidence of the power' },
    { r: /\ba testament to\b/gi, rep: 'proof of' },
    { r: /\btestament to\b/gi, rep: 'proof of' },
    { r: /\btestament\b/gi, rep: 'proof' },
    { r: /\bstands as\b/gi, rep: 'remains' },
    { r: /\ba tribute to\b/gi, rep: 'credit to' },
    { r: /\btribute to\b/gi, rep: 'credit to' },
    { r: /\bplays a (?:pivotal|crucial|vital|key) role in\b/gi, rep: 'is key to' },
    { r: /\bplays a (?:pivotal|crucial|vital|key) role\b/gi, rep: 'is vital' },
    { r: /\bplays a role in\b/gi, rep: 'helps with' },
    { r: /\bvital role\b/gi, rep: 'key part' },
    { r: /\bcrucial aspect\b/gi, rep: 'key point' },
    { r: /\bparamount importance\b/gi, rep: 'high importance' },
    { r: /\bvital importance\b/gi, rep: 'high importance' },
    { r: /\bdelve[s]? deeper into\b/gi, rep: 'look closer at' },
    { r: /\bdelving deeper into\b/gi, rep: 'a closer look at' },
    { r: /\bdelve[s]? deeper\b/gi, rep: 'look closer' },
    { r: /\bdelving deeper\b/gi, rep: 'a closer look' },
    { r: /\bdelve[s]? into\b/gi, rep: 'explore' },
    { r: /\bdelving into\b/gi, rep: 'exploring' },
    { r: /\bdelve\b/gi, rep: 'dig' },
    { r: /\bdelves\b/gi, rep: 'digs' },
    { r: /\bdelving\b/gi, rep: 'digging' },
    { r: /\ba tapestry of\b/gi, rep: 'a rich mix of' },
    { r: /\btapestry of\b/gi, rep: 'mix of' },
    { r: /\btapestry\b/gi, rep: 'mosaic' },
    { r: /\ba rich blend\b/gi, rep: 'a wide mix' },
    { r: /\bbeacon of hope\b/gi, rep: 'sign of hope' },
    { r: /\bbeacon\b/gi, rep: 'guide' },
    { r: /\bparamount\b/gi, rep: 'essential' },
    { r: /\bpivotal\b/gi, rep: 'central' },
    { r: /\bvital\b/gi, rep: 'key' },
    { r: /\bcrucial\b/gi, rep: 'essential' },
    { r: /\bunderscore[s]?\b/gi, rep: 'highlights' },
    { r: /\bunderscoring\b/gi, rep: 'highlighting' },
    { r: /\bfoster[s]?\b/gi, rep: 'builds' },
    { r: /\bfostering\b/gi, rep: 'building' },
    { r: /\bintricate\b/gi, rep: 'detailed' },
    { r: /\bintricacies\b/gi, rep: 'details' },
    { r: /\ba plethora of\b/gi, rep: 'a wide range of' },
    { r: /\bplethora of\b/gi, rep: 'a wide range of' },
    { r: /\bplethora\b/gi, rep: 'wealth' },
    { r: /\ba myriad of\b/gi, rep: 'countless' },
    { r: /\bmyriad of\b/gi, rep: 'countless' },
    { r: /\bmyriad\b/gi, rep: 'countless' },
    { r: /\bmultifaceted\b/gi, rep: 'varied' },
    { r: /\bseamlessly\b/gi, rep: 'smoothly' },
    { r: /\bcaptivated by\b/gi, rep: 'drawn to' },
    { r: /\bcaptivating\b/gi, rep: 'engaging' },
    { r: /\bcaptivated\b/gi, rep: 'drawn' },
    { r: /\bmesmerized by\b/gi, rep: 'fascinated by' },
    { r: /\bmesmerized\b/gi, rep: 'fascinated' },
    { r: /\binterplay (?:between|of)\b/gi, rep: 'connection between' },
    { r: /\binterplay\b/gi, rep: 'interaction' },
    { r: /\bgame-changer\b/gi, rep: 'turning point' },
    { r: /\btransformative\b/gi, rep: 'powerful' },
    { r: /\bnuanced\b/gi, rep: 'subtle' },
    { r: /\bcornerstone\b/gi, rep: 'foundation' },
    { r: /\bever-evolving\b/gi, rep: 'changing' },
    { r: /\bever-changing landscape\b/gi, rep: 'shifting landscape' },
    { r: /\bdynamic landscape\b/gi, rep: 'changing scene' },
    { r: /\bcomplex landscape\b/gi, rep: 'complex field' },
    { r: /\bnavigate the complexities of\b/gi, rep: 'work through' },
    { r: /\bnavigate the complexities\b/gi, rep: 'work through difficulties' },
    { r: /\bembark[s]? on\b/gi, rep: 'starts' },
    { r: /\bembarking on\b/gi, rep: 'starting' },
    { r: /\bharness(?:ing)? the power of\b/gi, rep: 'using' },
    { r: /\bharness(?:ing)? the power\b/gi, rep: 'using the strength' },
    { r: /\bharness(?:ing)?\b/gi, rep: 'using' },
    { r: /\bdeep dive into\b/gi, rep: 'close look at' },
    { r: /\bdeep dive\b/gi, rep: 'in-depth look' },
    { r: /\boverarching\b/gi, rep: 'broad' },
    { r: /\bintertwined\b/gi, rep: 'linked' },
    { r: /\bparadigm shift\b/gi, rep: 'major shift' },
    { r: /\ba stunning array of\b/gi, rep: 'a wide range of' },
    { r: /\bstunning array of\b/gi, rep: 'wide range of' },
    { r: /\bstunning array\b/gi, rep: 'wide range' },
    { r: /\ba vast array of\b/gi, rep: 'many' },
    { r: /\ba vast array\b/gi, rep: 'a broad assortment' },
    { r: /\bvast array of\b/gi, rep: 'wide range of' },
    { r: /\binvaluable\b/gi, rep: 'priceless' },
    { r: /\bindispensable\b/gi, rep: 'essential' },
    { r: /\bmeticulous(?:ly)?\b/gi, rep: 'careful' },
    { r: /\bprofound impact\b/gi, rep: 'major effect' },
    { r: /\bresonate[s]? with\b/gi, rep: 'matters to' },
    { r: /\bresonate[s]?\b/gi, rep: 'connects' },
    { r: /\bresonating\b/gi, rep: 'connecting' },
    { r: /\bshed[s]? light on\b/gi, rep: 'explains' },
    { r: /\bshedding light on\b/gi, rep: 'explaining' },
    { r: /\bpave[s]? the way for\b/gi, rep: 'opens the door to' },
    { r: /\bpaving the way for\b/gi, rep: 'opening the door to' },
    { r: /\butilize[s]?\b/gi, rep: 'use' },
    { r: /\butilizing\b/gi, rep: 'using' },
    { r: /\bleverage[s]?\b/gi, rep: 'use' },
    { r: /\bleveraging\b/gi, rep: 'using' },
    { r: /\bfacilitate[s]?\b/gi, rep: 'help' },
    { r: /\bcommence[s]?\b/gi, rep: 'start' },
    { r: /\boptimal\b/gi, rep: 'best' },
    { r: /\brealm(?: of)?\b/gi, rep: 'field' },
    { r: /\bubiquitous\b/gi, rep: 'everywhere' },
    { r: /\bcatalyst(?: for)?\b/gi, rep: 'driver' },
    { r: /\bepitome of\b/gi, rep: 'model of' },
    { r: /\bepitome\b/gi, rep: 'peak' },
    { r: /\blinchpin\b/gi, rep: 'backbone' },
    { r: /\bpanacea\b/gi, rep: 'cure-all' },
    { r: /\bparagon of\b/gi, rep: 'model of' },
    { r: /\bparagon\b/gi, rep: 'model' },
    { r: /\bsalient\b/gi, rep: 'notable' },
    { r: /\bsynerg(?:y|ies)\b/gi, rep: 'connections' },
    { r: /\bunwavering\b/gi, rep: 'steady' },
    { r: /\bquintessential\b/gi, rep: 'classic' },
    { r: /\bbreathtaking\b/gi, rep: 'stunning' },
    { r: /\bholistic\b/gi, rep: 'complete' },
    { r: /\bemboldened\b/gi, rep: 'encouraged' },
    { r: /\bunraveling\b/gi, rep: 'untangling' },
    { r: /\bunravel(?:s)?\b/gi, rep: 'untangle' },
    { r: /\brevolutionizing\b/gi, rep: 'transforming' },
    { r: /\brevolutionize[s]?\b/gi, rep: 'transform' },
    { r: /\bvibrant\b/gi, rep: 'lively' },
    { r: /\bstrikes? a balance\b/gi, rep: 'finds a balance' },
    { r: /\bstriking a balance\b/gi, rep: 'finding a balance' },
    { r: /\bserves as a reminder\b/gi, rep: 'reminds us' },
    { r: /\bserves as an example\b/gi, rep: 'shows' },
    { r: /\bone cannot overlook\b/gi, rep: 'we must consider' },
    { r: /\bit remains to be seen\b/gi, rep: 'it is not yet clear' },
    { r: /\bit is essential to\b/gi, rep: 'we need to' },
    { r: /\bit is imperative that\b/gi, rep: 'we must' },
    { r: /\bundoubtedly\b/gi, rep: 'clearly' },
    { r: /\b(?:in )?today's (?:fast-paced )?world\b/gi, rep: 'nowadays' },
    { r: /\bin the modern era\b/gi, rep: 'today' },
    { r: /\bin today's society\b/gi, rep: 'in society today' },
  ];

  lexicalReplacements.forEach(({ r, rep }) => {
    processed = processed.replace(r, rep);
  });

  // 4. Natural Contraction Enforcement (Breaks token predictability)
  const contractions = [
    [/\bit is\b/gi, "it's"],
    [/\bdo not\b/gi, "don't"],
    [/\bcannot\b/gi, "can't"],
    [/\bcan not\b/gi, "can't"],
    [/\bdoes not\b/gi, "doesn't"],
    [/\bdid not\b/gi, "didn't"],
    [/\bwas not\b/gi, "wasn't"],
    [/\bwere not\b/gi, "weren't"],
    [/\bthey are\b/gi, "they're"],
    [/\bthey will\b/gi, "they'll"],
    [/\bwe are\b/gi, "we're"],
    [/\bwe have\b/gi, "we've"],
    [/\bwe will\b/gi, "we'll"],
    [/\byou are\b/gi, "you're"],
    [/\byou will\b/gi, "you'll"],
    [/\bthat is\b/gi, "that's"],
    [/\bthere is\b/gi, "there's"],
    [/\bwhat is\b/gi, "what's"],
    [/\bcould not\b/gi, "couldn't"],
    [/\bshould not\b/gi, "shouldn't"],
    [/\bwould not\b/gi, "wouldn't"],
    [/\bhas not\b/gi, "hasn't"],
    [/\bhave not\b/gi, "haven't"],
    [/\bhad not\b/gi, "hadn't"],
    [/\bis not\b/gi, "isn't"],
    [/\bare not\b/gi, "aren't"],
  ];
  contractions.forEach(([pattern, repl]) => {
    processed = processed.replace(pattern, repl);
  });

  // Strip accidental leading em-dashes, bullets, or quotes from raw LLM responses
  processed = processed.replace(/^[—–\-•*#"'`\s]+/, '');

  // 5. Fix Sentence Capitalization from Stripped Openers
  processed = processed.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());

  // 6. Invert Participial "-ing" Sentence Openers (RUN AFTER CAPITALIZATION)
  // (Prevents detector penalizing repetitive participial clauses)
  const nonParticipials = new Set(['during', 'spring', 'ring', 'king', 'wing', 'thing', 'morning', 'evening']);
  processed = processed.replace(/(?:^|[.!?]\s+)([A-Z][a-z]+ing)\b/g, (match, word) => {
    if (nonParticipials.has(word.toLowerCase())) return match;
    const prefix = match.match(/^[.!?]\s+/) ? match.match(/^[.!?]\s+/)[0] : '';
    if (word.toLowerCase() === 'looking') return `${prefix}A closer look at this`;
    if (word.toLowerCase() === 'using') return `${prefix}It's clear that using`;
    if (word.toLowerCase() === 'exploring') return `${prefix}To explore`;
    if (word.toLowerCase() === 'building') return `${prefix}To build`;
    if (word.toLowerCase() === 'seeking') return `${prefix}In seeking`;
    if (word.toLowerCase() === 'navigating') return `${prefix}When tackling`;
    if (word.toLowerCase() === 'harnessing') return `${prefix}By applying`;
    return `${prefix}By ${word.toLowerCase()}`;
  });

  // 7. Burstiness & Cadence Perturber across Paragraphs
  const paragraphs = processed.split(/\n\n+/);
  const adjustedParagraphs = paragraphs.map((para) => {
    const rawSentences = para.match(/[^.!?\n]+(?:[.!?]+(?=[\s\n]|$)|$)/g) || [para];
    let sentences = rawSentences.map((s) => s.trim()).filter((s) => s.split(/\s+/).filter(Boolean).length > 0);
    if (sentences.length <= 1) return para;

    const countW = (s) => s.split(/\s+/).filter(Boolean).length;

    // Check burstiness of this paragraph
    const getCv = (sList) => {
      const lengths = sList.map((s) => countW(s));
      const m = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const v = lengths.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / lengths.length;
      return m > 0 ? Math.sqrt(v) / m : 1.0;
    };

    // First Pass: Disrupt consecutive uniform sentences (deltas <= 2)
    for (let i = 0; i < sentences.length - 1; i++) {
      const currWords = countW(sentences[i]);
      const nextWords = countW(sentences[i + 1]);
      if (Math.abs(currWords - nextWords) <= 2 && currWords >= 9 && currWords <= 20) {
        // Merge with em-dash to create a long compound sentence
        const first = sentences[i].replace(/[.!?]+$/, '');
        let second = sentences[i + 1].trim();
        second = second.charAt(0).toLowerCase() + second.slice(1);
        sentences[i] = `${first} — and ${second}`;
        sentences.splice(i + 1, 1);
        break;
      }
    }

    // Second Pass: If CV is still below 0.60, check if we need a punchy cadence closer or clause split
    let currentCv = getCv(sentences);
    if (currentCv < 0.60 && sentences.length >= 2) {
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        if (s.includes(', and ') && countW(s) >= 16) {
          const parts = s.split(', and ');
          sentences[i] = parts[0].replace(/[.!?]+$/, '') + '.';
          sentences.splice(i + 1, 0, 'And ' + parts.slice(1).join(', and '));
          break;
        } else if (s.includes(', but ') && countW(s) >= 14) {
          const parts = s.split(', but ');
          sentences[i] = parts[0].replace(/[.!?]+$/, '') + '.';
          sentences.splice(i + 1, 0, 'But ' + parts.slice(1).join(', but '));
          break;
        }
      }

      currentCv = getCv(sentences);
      if (currentCv < 0.50 && sentences.length <= 4) {
        sentences.push("The difference is clear.");
      }
    }

    return sentences.join(' ');
  });

  processed = adjustedParagraphs.join('\n\n');

  // 8. Guarantee Contraction Reward (-10% AI Likelihood)
  const hasContractions = /\b(it's|don't|can't|won't|didn't|doesn't|they're|we're|you're|that's|wasn't|here's|there's)\b/i.test(processed);
  const totalWords = processed.split(/\s+/).filter(Boolean).length;
  if (!hasContractions && totalWords >= 20) {
    if (processed.includes('is proof of')) {
      processed = processed.replace('is proof of', "it's proof of");
    } else if (processed.includes('is key to')) {
      processed = processed.replace('is key to', "it's key to");
    } else if (processed.includes('is essential')) {
      processed = processed.replace('is essential', "it's essential");
    } else if (processed.includes('This shows')) {
      processed = processed.replace('This shows', "That's evidence");
    } else {
      processed = processed.replace(/([.!?]\s+)(By using\b)/i, "$1It's clear that using");
      if (!/\b(it's|that's|there's)\b/i.test(processed)) {
        processed = processed.replace(/(^[A-Z][a-z]+[^.!?]+\.\s*)([A-Z])/i, "$1Truth is, it's $2");
      }
    }
  }

  // 8. Fix Sentence Capitalization from Stripped Openers
  processed = processed.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());

  // 9. Restore Masked Entities
  maskedDecimals.forEach(({ key, match }) => {
    processed = processed.replaceAll(key, match);
  });
  maskedEmails.forEach(({ key, match }) => {
    processed = processed.replaceAll(key, match);
  });
  maskedUrls.forEach(({ key, match }) => {
    processed = processed.replaceAll(key, match);
  });

  return processed.trim();
}

export default {
  SYSTEM_PROMPTS,
  buildHumanizerPrompt,
  buildParaphrasePrompt,
  buildEssayPrompt,
  EXTRACTION_PROMPT,
  SYNTHESIS_PROMPT,
  applyPostFilter,
};
