import { config } from '../../config/env.js';

export class RankingService {
  constructor() {
    this.weights = config.retrieval?.weights || {
      semantic: 0.85,
      domain: 0.075,
      complexity: 0.075,
    };
  }

  /**
   * Hybrid ranking combining vector semantic similarity with metadata attributes
   */
  rank(candidates, queryContext = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [];
    }

    const targetDomain = (queryContext.domain || 'General').toLowerCase();
    const targetComplexity = (queryContext.complexity || 'Medium').toLowerCase();

    const ranked = candidates.map((candidate) => {
      // 1. Semantic Similarity Score (0 to 1)
      const rawSemantic = candidate.semanticScore ?? 0;
      const semanticScore = Math.max(0, Math.min(1, rawSemantic));

      // 2. Domain Match Score (0 to 1)
      const candidateDomain = (candidate.domain || 'General').toLowerCase();
      const domainScore = this.computeDomainMatch(candidateDomain, targetDomain);

      // 3. Complexity Match Score (0 to 1)
      const candidateComplexity = (candidate.complexity || 'Medium').toLowerCase();
      const complexityScore = this.computeComplexityMatch(candidateComplexity, targetComplexity);

      // Final weighted hybrid score
      const finalScore =
        semanticScore * (this.weights.semantic ?? 0.85) +
        domainScore * (this.weights.domain ?? 0.075) +
        complexityScore * (this.weights.complexity ?? 0.075);

      return {
        ...candidate,
        finalScore: Number(finalScore.toFixed(4)),
        rankingBreakdown: {
          semanticScore: Number(semanticScore.toFixed(4)),
          domainScore: Number(domainScore.toFixed(2)),
          complexityScore: Number(complexityScore.toFixed(2)),
        },
      };
    });

    // Sort descending by final hybrid score
    ranked.sort((a, b) => b.finalScore - a.finalScore);
    return ranked;
  }

  computeStyleMatch(candidateStyle, targetStyle) {
    if (candidateStyle === targetStyle) return 1.0;

    // Related style affinity matrix
    const affinities = {
      conversational: ['natural', 'casual', 'friendly'],
      natural: ['conversational', 'flowing', 'standard'],
      professional: ['structured', 'academic', 'business'],
      simple: ['concise', 'plain', 'conversational'],
      detailed: ['academic', 'comprehensive', 'structured'],
      storytelling: ['creative', 'vivid', 'expressive'],
    };

    if (affinities[targetStyle]?.includes(candidateStyle)) return 0.6;
    if (affinities[candidateStyle]?.includes(targetStyle)) return 0.6;
    return 0.2;
  }

  computeToneMatch(candidateTone, targetTone) {
    if (candidateTone === targetTone) return 1.0;

    const toneAffinities = {
      natural: ['conversational', 'friendly', 'casual'],
      professional: ['formal', 'academic', 'persuasive'],
      academic: ['professional', 'analytical', 'formal'],
      casual: ['conversational', 'friendly', 'natural'],
      friendly: ['conversational', 'warm', 'casual'],
      persuasive: ['compelling', 'professional', 'confident'],
      creative: ['expressive', 'vivid', 'storytelling'],
      concise: ['direct', 'simple', 'punchy'],
    };

    if (toneAffinities[targetTone]?.includes(candidateTone)) return 0.6;
    if (toneAffinities[candidateTone]?.includes(targetTone)) return 0.6;
    return 0.2;
  }

  computeDomainMatch(candidateDomain, targetDomain) {
    if (candidateDomain === targetDomain) return 1.0;
    if (candidateDomain === 'general' || targetDomain === 'general') return 0.6;
    return 0.2;
  }

  computeComplexityMatch(candidateComp, targetComp) {
    if (candidateComp === targetComp) return 1.0;
    const levels = ['simple', 'medium', 'advanced'];
    const idx1 = levels.indexOf(candidateComp);
    const idx2 = levels.indexOf(targetComp);

    if (idx1 !== -1 && idx2 !== -1) {
      const diff = Math.abs(idx1 - idx2);
      if (diff === 1) return 0.5; // Adjacent complexity
    }
    return 0.1;
  }
}

export const rankingService = new RankingService();
export default rankingService;
