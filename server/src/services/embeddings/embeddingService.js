import crypto from 'crypto';
import { config } from '../../config/env.js';

export class EmbeddingService {
  constructor() {
    this.baseUrl = (config.ollama.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    this.embedModel = config.ollama.embedModel || 'nomic-embed-text';
    this.timeout = 25000;
    this.cache = new Map();
    this.maxCacheSize = 2500;
  }

  /**
   * Compute deterministic SHA-256 hash for a given text string
   */
  hashText(text) {
    return crypto.createHash('sha256').update((text || '').trim().toLowerCase()).digest('hex');
  }

  /**
   * Fast cosine similarity between two numeric vectors
   */
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate an embedding vector for a single text
   */
  async generateEmbedding(text, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return null;
    }

    const cleanText = text.trim();
    const hash = this.hashText(cleanText);
    const cacheKey = `${this.embedModel}:${hash}`;

    // 1. Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const maxRetries = options.retries ?? 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Try modern Ollama /api/embeddings or /api/embed
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.embedModel,
            prompt: cleanText,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Ollama embedding error ${response.status}: ${errText || response.statusText}`);
        }

        const data = await response.json();
        const embedding = data.embedding || (Array.isArray(data.embeddings) ? data.embeddings[0] : null);

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Ollama returned invalid embedding format.');
        }

        // Cache result
        if (this.cache.size >= this.maxCacheSize) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }
        this.cache.set(cacheKey, embedding);

        return embedding;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    console.warn(`[EmbeddingService] Embedding failed for "${cleanText.slice(0, 40)}...": ${lastError?.message}`);
    return null;
  }

  /**
   * Batch generate embeddings for multiple texts
   */
  async generateBatchEmbeddings(texts, concurrency = 4) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const results = new Array(texts.length).fill(null);
    let index = 0;

    const worker = async () => {
      while (index < texts.length) {
        const currentIndex = index++;
        try {
          results[currentIndex] = await this.generateEmbedding(texts[currentIndex]);
        } catch (err) {
          results[currentIndex] = null;
        }
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, texts.length) }, () => worker());
    await Promise.all(pool);
    return results;
  }

  /**
   * Check if embedding model is loaded in Ollama
   */
  async healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          service: 'EmbeddingService',
          model: this.embedModel,
          reachable: false,
          status: 'unreachable',
        };
      }

      const data = await res.json();
      const models = (data.models || []).map((m) => m.name || m.model || '');
      const available = models.some((n) => n.includes('nomic-embed-text') || n === this.embedModel);

      return {
        service: 'EmbeddingService',
        model: this.embedModel,
        reachable: true,
        modelAvailable: available,
        cachedCount: this.cache.size,
        status: available ? 'ready' : 'model_missing',
      };
    } catch (err) {
      return {
        service: 'EmbeddingService',
        model: this.embedModel,
        reachable: false,
        error: err.message,
        status: 'unreachable',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      cachedItems: this.cache.size,
      maxCapacity: this.maxCacheSize,
      model: this.embedModel,
    };
  }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
