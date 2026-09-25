import OpenAI from "openai";
import AIService from "../src/services/ai/aiService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

// Stage 3: Syntactic Perturbation Post-Filter
function applyPostFilter(text) {
  let processed = text;
  
  const aiMarkers = [
    /\b(Furthermore|Moreover|Additionally|In summary|In conclusion|Notably|Importantly|Ultimately),?\s*/gi,
    /\bIt is worth noting that\s*/gi,
    /\bstands as a testament to\b/gi,
  ];
  aiMarkers.forEach((regex) => { processed = processed.replace(regex, ""); });

  const contractions = [
    [/\bdo not\b/gi, "don't"], [/\bcannot\b/gi, "can't"],
    [/\bit is\b/gi, "it's"], [/\bthat is\b/gi, "that's"],
    [/\bwas not\b/gi, "wasn't"], [/\bdid not\b/gi, "didn't"]
  ];
  contractions.forEach(([pattern, repl]) => { processed = processed.replace(pattern, repl); });

  processed = processed.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  return processed.trim();
}

export const processRewrite = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Calculate the target word count dynamically
    const targetWordCount = text.split(/\s+/).filter(Boolean).length;

    // If OPENAI_API_KEY is configured, run OpenAI direct completion
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your_")) {
      // Stage 1: Exhaustive Detail Extraction (Prevents summarization)
      const EXTRACTION_PROMPT = `You are a meticulous data extractor. Extract an EXHAUSTIVE, highly detailed bulleted outline of the user's text. 
    Capture every minor detail, supporting argument, descriptive element, and logical step. 
    CRITICAL: Strip away the original sentence structures and AI-style transitions, converting everything into raw, disjointed fragments. Do not summarize; retain the full depth of information.`;

      const extraction = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: text },
        ],
      });
      const detailedFacts = extraction.choices[0].message.content;

      // Stage 2: Length-Constrained Synthesis
      const SYNTHESIS_PROMPT = `You are an expert human essayist. Reconstruct the provided detailed outline into a coherent narrative.

    NON-NEGOTIABLE CONSTRAINTS:
    1. TARGET LENGTH: You MUST write approximately ${targetWordCount} words. To reach this length, use deep descriptive expansion and complex, asymmetric sentence structures. Do NOT add generic filler to hit the word count.
    2. RADICAL CADENCE & BURSTINESS: Actively vary sentence lengths. Alternate short, blunt sentences (3-7 words) with long, asymmetric compound-complex sentences (25-35 words). Never write three consecutive sentences of similar word count.
    3. SYNTACTIC FLUIDITY: Avoid typical AI openers ("Rising from...", "Built by..."). Use natural contractions (it's, didn't, wasn't, they're).
    4. BANNED VOCABULARY: Do NOT use: "testament to", "stands as", "tapestry", "beacon", "delve", "intricate", "mesmerized", "captivated", "vital role", "pivotal", "underscores", "fosters", "stunning array", "moreover", "furthermore".
    
    Output ONLY the final reconstructed text without commentary, titles, or quotes.`;

      const synthesis = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.90,       // Slightly lower than 0.92 to keep long generations coherent
        top_p: 0.92,
        frequency_penalty: 0.50, 
        presence_penalty: 0.35,  
        messages: [
          { role: "system", content: SYNTHESIS_PROMPT },
          { role: "user", content: `Reconstruct these core notes into a ~${targetWordCount}-word text:\n\n${detailedFacts}` },
        ],
      });
      
      // Stage 3: Apply Filters
      const finalText = applyPostFilter(synthesis.choices[0].message.content);

      return res.json({ 
        original: text, 
        rewritten: finalText,
        originalCount: targetWordCount,
        newCount: finalText.split(/\s+/).filter(Boolean).length
      });
    }

    // Otherwise use multi-provider engine (Ollama / Local / Smart-Linguistic) with dynamic length
    const result = await AIService.rewrite({
      text,
      ...req.body,
    });

    const newWordCount = result.rewrittenText.split(/\s+/).filter(Boolean).length;
    return res.json({
      original: text,
      rewritten: result.rewrittenText,
      originalCount: targetWordCount,
      newCount: newWordCount,
      ...result,
    });
  } catch (error) {
    console.error("Rewrite Error:", error);
    res.status(500).json({ error: "Server failed to process text." });
  }
};

export default { processRewrite };
