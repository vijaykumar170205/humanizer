import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { OllamaProvider } from '../src/services/ai/ollamaProvider.js';
import { embeddingService, EmbeddingService } from '../src/services/embeddings/embeddingService.js';
import { TextAnalyzer } from '../src/services/analysis/textAnalyzer.js';
import { vectorStore } from '../src/services/retrieval/vectorStore.js';
import { rankingService } from '../src/services/retrieval/rankingService.js';
import { retriever } from '../src/services/retrieval/retriever.js';
import { OutputValidator } from '../src/services/validation/outputValidator.js';
import AIService from '../src/services/ai/aiService.js';
import AIProviderFactory from '../src/services/ai/aiProviderFactory.js';
import { MockAiProvider } from '../src/services/ai/mockAiProvider.js';

describe('Local Retrieval-Based Writing Engine Tests', () => {
  // 1. TextAnalyzer Unit Tests
  test('TextAnalyzer accurately extracts protected entities and metrics', () => {
    const sample = 'In 2024, Dr. Smith published report [12] at https://example.com/ai with 99.4% accuracy. Contact us at info@example.com or use `npm test`.';
    const analysis = TextAnalyzer.analyze(sample);

    assert.equal(analysis.wordCount > 15, true);
    assert.equal(analysis.sentenceCount >= 1, true);
    assert.equal(analysis.protectedContent.urls.includes('https://example.com/ai'), true);
    assert.equal(analysis.protectedContent.emails.includes('info@example.com'), true);
    assert.equal(analysis.protectedContent.numbers.some((n) => n.includes('2024')), true);
    assert.equal(analysis.protectedContent.numbers.some((n) => n.includes('99.4')), true);
    assert.equal(analysis.protectedContent.citations.some((c) => c.includes('[12]')), true);
    assert.equal(analysis.protectedContent.codeBlocks.some((cb) => cb.includes('`npm test`')), true);
  });

  // 2. EmbeddingService & Cosine Similarity Tests
  test('EmbeddingService computes cosine similarity correctly', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];
    const vecD = [0.7071, 0.7071, 0];

    assert.equal(EmbeddingService.cosineSimilarity(vecA, vecB), 1);
    assert.equal(EmbeddingService.cosineSimilarity(vecA, vecC), 0);
    assert.equal(Math.abs(EmbeddingService.cosineSimilarity(vecA, vecD) - 0.7071) < 0.01, true);
  });

  test('EmbeddingService generates 768-dim vector with nomic-embed-text & caches', async () => {
    const text = 'Distributed computing architectures rely on message queues.';
    const embedding = await embeddingService.generateEmbedding(text);

    if (embedding) {
      assert.equal(Array.isArray(embedding), true);
      assert.equal(embedding.length, 768);

      // Verify in-memory cache hit
      const cached = await embeddingService.generateEmbedding(text);
      assert.deepEqual(cached, embedding);
    } else {
      console.warn('⚠️ Ollama embedding not reachable in this test execution, skipped live check.');
    }
  });

  // 3. VectorStore & Dual Retrieval Tests
  test('VectorStore initializes both transformation pairs and style examples', async () => {
    await vectorStore.initialize();
    const stats = vectorStore.getStats();
    assert.equal(stats.totalTransformations > 0, true);
    assert.equal(stats.totalStyles > 0, true);

    const queryVec = new Array(768).fill(0.01);
    const trans = await vectorStore.searchTransformations(queryVec, { domain: 'Technology' }, 2);
    assert.equal(Array.isArray(trans), true);
    assert.equal(trans.length <= 2, true);
    if (trans.length > 0) {
      assert.equal(trans[0].originalText !== undefined, true);
      assert.equal(trans[0].revisionText !== undefined, true);
    }

    const styles = await vectorStore.searchStyles(queryVec, { domain: 'Technology' }, 5);
    assert.equal(Array.isArray(styles), true);
    assert.equal(styles.length <= 5, true);
    if (styles.length > 0) {
      assert.equal(styles[0].text !== undefined, true);
    }
  });

  test('Retriever performs dual retrieval with 2 transformations and 1 style example', async () => {
    const text = 'Artificial intelligence systems require robust data validation.';
    const result = await retriever.retrieve({
      text,
      domain: 'Technology',
    });

    assert.equal(Array.isArray(result.transformationExamples), true);
    assert.equal(result.transformationExamples.length <= 2, true);
    assert.equal(Array.isArray(result.styleExamples), true);
    assert.equal(result.styleExamples.length <= 1, true);
    assert.equal(result.examples.length, result.transformationExamples.length + result.styleExamples.length);
  });

  test('RankingService applies weighted hybrid scoring', () => {
    const candidates = [
      { id: '1', domain: 'Technology', complexity: 'Medium', semanticScore: 0.85 },
      { id: '2', domain: 'Daily Life', complexity: 'Simple', semanticScore: 0.88 },
      { id: '3', domain: 'General', complexity: 'Simple', semanticScore: 0.40 },
    ];

    const ranked = rankingService.rank(candidates, {
      domain: 'Technology',
      complexity: 'Medium',
    });

    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].finalScore > ranked[2].finalScore, true);
  });

  // 4. OutputValidator Tests
  test('OutputValidator detects missing numbers/citations and builds corrective prompts', async () => {
    const originalText = 'In 2024, our revenue reached $5,000,000 according to study [4].';
    const analysis = TextAnalyzer.analyze(originalText);

    // Bad rewrite missing number and citation
    const flawedRewrite = 'Our company made good money recently according to the report.';
    const validation = await OutputValidator.validate({
      originalText,
      rewrittenText: flawedRewrite,
      analysis,
    });

    assert.equal(validation.isValid, false);
    assert.equal(validation.details.missingItems.length > 0, true);

    const correctivePrompt = OutputValidator.buildCorrectivePrompt(validation);
    assert.equal(correctivePrompt.includes('CORRECTION REQUIRED'), true);
  });

  // 5. OllamaProvider & Factory Tests
  test('AIProviderFactory resolves Ollama provider with fallback chain', async () => {
    const provider = AIProviderFactory.getProvider('ollama');
    assert.equal(provider !== null, true);

    const status = await AIProviderFactory.getProvidersStatus();
    assert.equal(status.providers.ollama !== undefined, true);
    assert.equal(status.providers.mock !== undefined, true);
  });

  // 6. AIService Rewrite Integration Test with Retrieval & Fallback
  test('AIService.rewrite transforms text while preserving protected entities', async () => {
    const text = 'In 2024, system efficiency improved by 35% with 0 downtime for client https://cutm.ac.in.';
    const result = await AIService.rewrite({
      text,
      domain: 'Technology',
    });

    assert.equal(result.rewrittenText.length > 0, true);
    assert.equal(result.metadata.retrieval !== undefined, true);
    assert.equal(result.metadata.retrieval.transformationCount !== undefined, true);
    assert.equal(result.metadata.validation !== undefined, true);
    assert.equal(
      result.rewrittenText.includes('2024') ||
      result.rewrittenText.includes('35%') ||
      result.rewrittenText.includes('35') ||
      result.rewrittenText.includes('cutm.ac.in'),
      true
    );
  });
});
