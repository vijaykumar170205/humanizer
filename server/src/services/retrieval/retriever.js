import { embeddingService } from '../embeddings/embeddingService.js';
import { vectorStore } from './vectorStore.js';
import { rankingService } from './rankingService.js';
import { config } from '../../config/env.js';

export class Retriever {
  constructor() {
    this.enabled = config.retrieval?.enabled !== false;
    this.defaultTopK = config.retrieval?.topK || 5;
    this.candidateK = config.retrieval?.candidateK || 20;
    this.styleThreshold = config.retrieval?.styleThreshold ?? 0.35;
  }

  /**
   * Retrieve most stylistically and semantically relevant writing examples
   * Separates Transformation Pairs from Natural Style Examples
   */
  async retrieve({
    text,
    domain = 'General',
    complexity = 'Medium',
    language = 'English',
    topK = null,
  }) {
    if (!this.enabled || !text || !text.trim()) {
      return {
        transformationExamples: [],
        styleExamples: [],
        examples: [],
        count: 0,
        retrievalMethod: 'disabled',
      };
    }

    const startTime = Date.now();

    try {
      // 1. Generate query embedding if available
      let queryEmbedding = null;
      try {
        queryEmbedding = await embeddingService.generateEmbedding(text);
      } catch (embErr) {
        console.warn(`[Retriever] Query embedding warning:`, embErr.message);
      }

      // 2. Retrieve Top 2 Transformation Examples (RAID / CoEdIT)
      const transformationExamples = await vectorStore.searchTransformations(
        queryEmbedding,
        { domain, complexity, language },
        2
      );

      // 3. Retrieve Style Candidate Examples (RAID / Curated)
      const styleCandidates = await vectorStore.searchStyles(
        queryEmbedding,
        { domain, complexity, language },
        this.candidateK
      );

      // 4. Rank Style Candidates and Apply Quality/Similarity Threshold (>= 0.35)
      let gatedStyleExamples = [];
      if (styleCandidates.length > 0) {
        const rankedStyles = rankingService.rank(styleCandidates, {
          domain,
          complexity,
          language,
        });

        // Filter top candidate by style similarity threshold
        const bestStyle = rankedStyles[0];
        const threshold = this.styleThreshold;
        const candidateScore = bestStyle ? (bestStyle.semanticScore ?? bestStyle.finalScore ?? 0) : 0;

        if (bestStyle && candidateScore >= threshold) {
          gatedStyleExamples = [bestStyle];
        } else {
          // Omit style sample if below threshold to prevent irrelevant stylistic distortion
          gatedStyleExamples = [];
        }
      }

      const combinedExamples = [...transformationExamples, ...gatedStyleExamples];

      return {
        transformationExamples,
        styleExamples: gatedStyleExamples,
        examples: combinedExamples,
        count: combinedExamples.length,
        latencyMs: Date.now() - startTime,
        retrievalMethod: queryEmbedding ? 'dual_vector_retrieval' : 'metadata_fallback',
      };
    } catch (err) {
      console.warn(`⚠️ [Retriever] Retrieval failed gracefully: ${err.message}`);
      return {
        transformationExamples: [],
        styleExamples: [],
        examples: [],
        count: 0,
        error: err.message,
        retrievalMethod: 'error_fallback',
      };
    }
  }
}

export const retriever = new Retriever();
export default retriever;
