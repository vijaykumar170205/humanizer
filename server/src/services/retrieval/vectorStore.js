import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StyleExample from '../../models/StyleExample.js';
import { EmbeddingService } from '../embeddings/embeddingService.js';
import { config } from '../../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VectorStore {
  constructor() {
    this.transformationExamples = [];
    this.styleExamples = [];
    this.inMemoryExamples = []; // alias for backward compatibility
    this.isInitialized = false;

    this.transformationDatasetPath = path.resolve(__dirname, '../../../data/final/retrieval_examples.jsonl');
    this.styleDatasetPath = path.resolve(__dirname, '../../../data/final/styleExamples.jsonl');
    this.fallbackDatasetPath = this.styleDatasetPath;
  }

  /**
   * Initialize and warm in-memory indices for both transformation pairs and style examples
   */
  async initialize() {
    try {
      // 1. Try loading both transformation pairs and style examples from MongoDB if connected
      const isMongoConnected = StyleExample.db?.readyState === 1;
      let loadedFromMongo = false;

      if (isMongoConnected) {
        try {
          const dbCount = await StyleExample.countDocuments({
            $or: [
              { embedding: { $exists: true, $ne: [] } },
              { source: 'raid' },
              { source: 'coedit' },
              { source: 'ielts' },
              { text: { $exists: true, $ne: '' } },
            ],
          });

          if (dbCount > 0) {
            const docs = await StyleExample.find(
              {},
              'text style tone domain complexity language embedding source license metadata originalText revisionText task'
            ).lean();

            const styles = [];
            const transforms = [];

            for (const doc of docs) {
              if (doc.source === 'raid' || doc.source === 'coedit' || (doc.originalText && doc.revisionText)) {
                transforms.push({
                  id: doc._id.toString(),
                  originalText: doc.originalText,
                  revisionText: doc.revisionText || doc.text,
                  task: doc.task || 'paraphrase',
                  domain: doc.domain || 'General',
                  complexity: doc.complexity || 'Medium',
                  language: doc.language || 'English',
                  embedding: Array.isArray(doc.embedding) && doc.embedding.length > 0 ? doc.embedding : null,
                  source: doc.source || 'raid',
                  license: doc.license || 'Open/Academic',
                });
              } else if (doc.text) {
                styles.push({
                  id: doc._id.toString(),
                  text: doc.text,
                  domain: doc.domain || 'General',
                  complexity: doc.complexity || 'Medium',
                  language: doc.language || 'English',
                  embedding: Array.isArray(doc.embedding) && doc.embedding.length > 0 ? doc.embedding : null,
                  source: doc.source || 'raid',
                  license: doc.license || 'Open/Academic',
                  metadata: doc.metadata || {},
                });
              }
            }

            if (transforms.length > 0) {
              this.transformationExamples = transforms;
              console.log(`✅ [VectorStore] Loaded ${transforms.length} transformation examples from MongoDB.`);
            }

            if (styles.length > 0) {
              this.styleExamples = styles;
              this.inMemoryExamples = styles;
              console.log(`✅ [VectorStore] Loaded ${styles.length} style examples from MongoDB.`);
            }

            if (transforms.length > 0 || styles.length > 0) {
              loadedFromMongo = true;
            }
          }
        } catch (mErr) {
          console.warn(`⚠️ [VectorStore] MongoDB query skipped (${mErr.message}). Falling back to file datasets.`);
        }
      }

      // 2. Fallback to file datasets if MongoDB was empty or unavailable
      if (!loadedFromMongo || this.transformationExamples.length === 0) {
        this.loadTransformationsFromFile();
      }

      if (!loadedFromMongo || this.styleExamples.length === 0) {
        this.loadStylesFromFile();
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn(`⚠️ [VectorStore] Initialization error:`, err.message);
      this.loadTransformationsFromFile();
      this.loadStylesFromFile();
      this.isInitialized = true;
    }
  }

  /**
   * Load transformation pairs from retrieval_examples.jsonl
   */
  loadTransformationsFromFile() {
    try {
      if (fs.existsSync(this.transformationDatasetPath)) {
        const content = fs.readFileSync(this.transformationDatasetPath, 'utf8');
        const lines = content.split('\n').filter((l) => l.trim());
        const parsed = [];

        for (let i = 0; i < lines.length; i++) {
          try {
            const item = JSON.parse(lines[i]);
            if (item.originalText && item.revisionText) {
              parsed.push({
                id: item.id || `trans_${i}`,
                originalText: item.originalText,
                revisionText: item.revisionText,
                task: item.task || 'paraphrase',
                style: item.style || 'Conversational',
                tone: item.tone || 'Natural',
                domain: item.domain || 'General',
                complexity: item.complexity || 'Medium',
                language: item.language || 'English',
                embedding: item.embedding || null,
                source: item.source || 'coedit',
                license: item.license || 'CC BY-SA 4.0',
              });
            }
          } catch (pErr) {
            // skip invalid line
          }
        }

        this.transformationExamples = parsed;
        console.log(`✅ [VectorStore] Loaded ${parsed.length} transformation examples from retrieval_examples.jsonl.`);
      } else {
        console.warn(`⚠️ [VectorStore] Transformation dataset not found at ${this.transformationDatasetPath}`);
      }
    } catch (err) {
      console.warn(`⚠️ [VectorStore] Failed loading transformations from file:`, err.message);
    }
  }

  /**
   * Load style examples from styleExamples.jsonl
   */
  loadStylesFromFile() {
    try {
      if (fs.existsSync(this.styleDatasetPath)) {
        const content = fs.readFileSync(this.styleDatasetPath, 'utf8');
        const lines = content.split('\n').filter((l) => l.trim());
        const parsed = [];

        for (let i = 0; i < lines.length; i++) {
          try {
            const item = JSON.parse(lines[i]);
            if (item.text) {
              parsed.push({
                id: item.id || `style_${i}`,
                text: item.text,
                style: item.style || 'Natural',
                tone: item.tone || 'Natural',
                domain: item.domain || 'General',
                complexity: item.complexity || 'Medium',
                language: item.language || 'English',
                embedding: item.embedding || null,
                source: item.source || 'ielts',
                license: item.license || 'Academic/Open',
                metadata: item.metadata || {},
              });
            }
          } catch (pErr) {
            // skip invalid line
          }
        }

        this.styleExamples = parsed;
        this.inMemoryExamples = parsed;
        console.log(`✅ [VectorStore] Loaded ${parsed.length} style examples from styleExamples.jsonl.`);
      } else {
        console.warn(`⚠️ [VectorStore] Style dataset not found at ${this.styleDatasetPath}`);
      }
    } catch (err) {
      console.warn(`⚠️ [VectorStore] Failed loading styles from file:`, err.message);
    }
  }

  /**
   * Search Transformation Pairs (CoEdIT)
   * Returns top matching transformation examples based on semantic similarity or metadata
   */
  async searchTransformations(queryVector, filters = {}, topK = 2) {
    if (!this.isInitialized || this.transformationExamples.length === 0) {
      await this.initialize();
    }

    const { domain, complexity, language, task } = filters;
    const candidates = [];
    const hasQueryVec = Array.isArray(queryVector) && queryVector.length > 0;

    for (const ex of this.transformationExamples) {
      if (language && ex.language && ex.language.toLowerCase() !== language.toLowerCase()) {
        continue;
      }

      let semanticScore = 0;
      if (hasQueryVec) {
        // Enforce: Search ONLY records with valid embeddings
        if (!ex.embedding || !Array.isArray(ex.embedding) || ex.embedding.length !== queryVector.length) {
          continue;
        }
        semanticScore = Math.max(0, EmbeddingService.cosineSimilarity(queryVector, ex.embedding));
      } else {
        // Fallback metadata heuristic only if NO query vector was provided (offline/unembedded query)
        let matchScore = 0.4;
        if (domain && ex.domain && ex.domain.toLowerCase() === domain.toLowerCase()) matchScore += 0.25;
        if (complexity && ex.complexity && ex.complexity.toLowerCase() === complexity.toLowerCase()) matchScore += 0.15;
        if (task && ex.task && ex.task.toLowerCase() === task.toLowerCase()) matchScore += 0.20;
        semanticScore = Math.min(0.95, matchScore);
      }

      candidates.push({
        id: ex.id,
        originalText: ex.originalText,
        revisionText: ex.revisionText,
        task: ex.task,
        style: ex.style,
        tone: ex.tone,
        domain: ex.domain,
        complexity: ex.complexity,
        language: ex.language,
        semanticScore,
        source: ex.source,
      });
    }

    candidates.sort((a, b) => b.semanticScore - a.semanticScore);
    return candidates.slice(0, topK);
  }

  /**
   * Search Natural Style Examples (IELTS & Curated)
   * Returns top matching style excerpts based strictly on cosine similarity
   */
  async searchStyles(queryVector, filters = {}, topK = 10) {
    if (!this.isInitialized || this.styleExamples.length === 0) {
      await this.initialize();
    }

    const { domain, complexity, language } = filters;
    const candidates = [];
    const hasQueryVec = Array.isArray(queryVector) && queryVector.length > 0;

    for (const ex of this.styleExamples) {
      if (language && ex.language && ex.language.toLowerCase() !== language.toLowerCase()) {
        continue;
      }

      let semanticScore = 0;
      if (hasQueryVec) {
        // Enforce: Search ONLY records with valid embeddings
        if (!ex.embedding || !Array.isArray(ex.embedding) || ex.embedding.length !== queryVector.length) {
          continue;
        }
        semanticScore = Math.max(0, EmbeddingService.cosineSimilarity(queryVector, ex.embedding));
      } else {
        // Fallback metadata heuristic only if NO query vector was provided
        let matchScore = 0.4;
        if (domain && ex.domain && ex.domain.toLowerCase() === domain.toLowerCase()) matchScore += 0.35;
        if (complexity && ex.complexity && ex.complexity.toLowerCase() === complexity.toLowerCase()) matchScore += 0.25;
        semanticScore = Math.min(0.95, matchScore);
      }

      candidates.push({
        id: ex.id,
        text: ex.text,
        domain: ex.domain,
        complexity: ex.complexity,
        language: ex.language,
        metadata: ex.metadata,
        semanticScore,
        source: ex.source,
      });
    }

    candidates.sort((a, b) => b.semanticScore - a.semanticScore);
    return candidates.slice(0, topK);
  }

  /**
   * Backward-compatible vector search (delegates to searchStyles)
   */
  async searchSimilar(queryVector, filters = {}, topK = 20) {
    return this.searchStyles(queryVector, filters, topK);
  }

  /**
   * Backward-compatible fallbackFilterOnly
   */
  fallbackFilterOnly(filters = {}, topK = 10) {
    return this.searchStyles(null, filters, topK);
  }

  /**
   * Insert new style example
   */
  async insertExample(doc) {
    const item = {
      id: doc._id?.toString() || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: doc.text,
      style: doc.style || 'Natural',
      tone: doc.tone || 'Natural',
      domain: doc.domain || 'General',
      complexity: doc.complexity || 'Medium',
      language: doc.language || 'English',
      embedding: doc.embedding || null,
      source: doc.source || 'ielts',
      license: doc.license || 'Academic/Open',
      metadata: doc.metadata || {},
    };
    this.styleExamples.push(item);
    this.inMemoryExamples = this.styleExamples;
  }

  getStats() {
    const transEmb = this.transformationExamples.filter((e) => e.embedding && e.embedding.length > 0).length;
    const styleEmb = this.styleExamples.filter((e) => e.embedding && e.embedding.length > 0).length;
    return {
      totalTransformations: this.transformationExamples.length,
      totalStyles: this.styleExamples.length,
      totalIndexed: this.transformationExamples.length + this.styleExamples.length,
      withEmbeddings: transEmb + styleEmb,
      transformationsWithEmbeddings: transEmb,
      stylesWithEmbeddings: styleEmb,
      isInitialized: this.isInitialized,
    };
  }
}

export const vectorStore = new VectorStore();
export default vectorStore;
