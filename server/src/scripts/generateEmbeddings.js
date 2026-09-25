import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import StyleExample from '../models/StyleExample.js';
import { embeddingService } from '../services/embeddings/embeddingService.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const retrievalJsonlPath = path.resolve(__dirname, '../../data/final/retrieval_examples.jsonl');
const styleJsonlPath = path.resolve(__dirname, '../../data/final/styleExamples.jsonl');

// Parse CLI arguments
const args = process.argv.slice(2);
let limit = Infinity;
let batchSize = 50;
let concurrency = 4;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--batch' && args[i + 1]) {
    batchSize = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--concurrency' && args[i + 1]) {
    concurrency = parseInt(args[i + 1], 10);
    i++;
  }
}

/**
 * Determine the exact text to embed for a given record.
 * For transformation pairs (CoEdIT): embed the target revisionText (or text).
 * For style examples (IELTS / curated): embed text.
 */
function getTextToEmbed(doc) {
  if (doc.source === 'coedit' || (doc.originalText && doc.revisionText)) {
    return (doc.revisionText || doc.text || '').trim();
  }
  return (doc.text || '').trim();
}

/**
 * Validate embedding vector integrity (array, expected length, finite numbers).
 */
function isValidEmbedding(vec, expectedDim) {
  if (!Array.isArray(vec) || vec.length !== expectedDim) return false;
  for (let i = 0; i < vec.length; i++) {
    if (typeof vec[i] !== 'number' || !Number.isFinite(vec[i])) return false;
  }
  return true;
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`⚡ [EMBEDDING GENERATOR] Humanly Retrieval Dataset`);
  console.log(`======================================================`);
  console.log(`MongoDB URI:       ${config.mongoUri}`);
  console.log(`Ollama Base URL:   ${config.ollama.baseUrl}`);
  console.log(`Embedding Model:   ${config.ollama.embedModel}`);
  console.log(`Batch Size:        ${batchSize}`);
  console.log(`Concurrency:       ${concurrency}`);
  console.log(`======================================================\n`);

  await mongoose.connect(config.mongoUri);
  console.log(`✅ Connected to MongoDB.`);

  // 1. Verify Ollama & dynamic embedding dimension
  const health = await embeddingService.healthCheck();
  if (!health.reachable) {
    console.error(`❌ Ollama is not reachable at ${config.ollama.baseUrl}. Ensure Ollama is running.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`✅ Ollama is ready. Probing model for embedding dimension...`);

  const probe = await embeddingService.generateEmbedding('Semantic retrieval probe', { retries: 3 });
  if (!probe || !Array.isArray(probe) || probe.length === 0) {
    console.error(`❌ Failed to obtain probe embedding from Ollama model ${config.ollama.embedModel}.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const EXPECTED_DIM = probe.length;
  console.log(`📐 Verified Embedding Dimension: ${EXPECTED_DIM} (model: ${config.ollama.embedModel})`);

  // 2. Load all records from database to evaluate state
  const totalCount = await StyleExample.countDocuments();
  console.log(`📊 Total records in database: ${totalCount}`);

  // Query records that lack a valid embedding
  const pendingDocs = await StyleExample.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $size: 0 } },
      { [`embedding.${EXPECTED_DIM - 1}`]: { $exists: false } },
      { [`embedding.${EXPECTED_DIM}`]: { $exists: true } },
    ],
  }).sort({ _id: 1 });

  const alreadyValidCount = totalCount - pendingDocs.length;
  console.log(`✨ Already valid embeddings: ${alreadyValidCount}/${totalCount}`);
  console.log(`🔄 Records requiring embedding: ${pendingDocs.length}`);

  if (pendingDocs.length === 0) {
    console.log(`🎉 100% of retrieval records already have valid embeddings!`);
    await syncJsonlFiles(EXPECTED_DIM);
    await mongoose.disconnect();
    process.exit(0);
  }

  let toProcess = pendingDocs;
  if (isFinite(limit) && limit > 0) {
    toProcess = pendingDocs.slice(0, limit);
    console.log(`⚡ Limit applied: processing ${toProcess.length} records.`);
  }

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // 3. Process records with controlled concurrency and bulk writes
  for (let i = 0; i < toProcess.length; i += batchSize) {
    const chunk = toProcess.slice(i, i + batchSize);
    const bulkOps = [];

    // Worker pool for concurrency within this batch
    let itemIndex = 0;
    const worker = async () => {
      while (itemIndex < chunk.length) {
        const curIdx = itemIndex++;
        const doc = chunk[curIdx];
        const textToEmbed = getTextToEmbed(doc);

        if (!textToEmbed || textToEmbed.length < 5) {
          console.warn(`\n⚠️ Record ${doc._id} has empty/invalid text to embed. Skipping.`);
          failCount++;
          continue;
        }

        try {
          const vector = await embeddingService.generateEmbedding(textToEmbed, { retries: 3 });
          if (isValidEmbedding(vector, EXPECTED_DIM)) {
            bulkOps.push({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $set: {
                    embedding: vector,
                    embeddingModel: config.ollama.embedModel,
                    embeddingVersion: 1,
                    embeddedAt: new Date(),
                    embeddingHash: embeddingService.hashText(textToEmbed),
                  },
                },
              },
            });
            successCount++;
          } else {
            console.warn(`\n⚠️ Invalid embedding returned for doc ${doc._id} (dim: ${vector?.length || 0})`);
            failCount++;
          }
        } catch (err) {
          console.warn(`\n⚠️ Embedding generation error for doc ${doc._id}: ${err.message}`);
          failCount++;
        }
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, chunk.length) }, () => worker());
    await Promise.all(pool);

    // Save batch progress safely to MongoDB
    if (bulkOps.length > 0) {
      await StyleExample.bulkWrite(bulkOps, { ordered: false });
    }

    const processedSoFar = Math.min(i + chunk.length, toProcess.length);
    const pct = Math.round((processedSoFar / toProcess.length) * 100);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const speed = processedSoFar > 0 ? (elapsedSec / processedSoFar * 1000).toFixed(1) : 0;

    process.stdout.write(
      `\rProcessing ${processedSoFar}/${toProcess.length} (${pct}%) | Success: ${successCount} | Failed: ${failCount} | ${speed}ms/item`
    );
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgTimePerItem = successCount > 0 ? ((Date.now() - startTime) / successCount).toFixed(1) : 0;

  console.log(`\n\n================ EMBEDDING SUMMARY ================`);
  console.log(`Total Records Processed:     ${toProcess.length}`);
  console.log(`Successfully Embedded:       ${successCount}`);
  console.log(`Failed / Skipped:            ${failCount}`);
  console.log(`Total Time:                  ${totalTimeSec} s`);
  console.log(`Average Latency Per Item:    ${avgTimePerItem} ms`);
  console.log(`====================================================\n`);

  // 4. Synchronize JSONL files with complete embeddings
  await syncJsonlFiles(EXPECTED_DIM);

  await mongoose.disconnect();
  console.log(`🔌 Disconnected from MongoDB. Complete.`);
}

/**
 * Synchronize all embedded records from MongoDB into the separated JSONL files:
 * 1. retrieval_examples.jsonl -> CoEdIT transformation pairs
 * 2. styleExamples.jsonl      -> IELTS and curated natural style examples
 */
async function syncJsonlFiles(expectedDim) {
  try {
    console.log(`💾 Synchronizing JSONL dataset files...`);
    const allDocs = await StyleExample.find({}).lean();

    const transformations = [];
    const styles = [];

    for (const doc of allDocs) {
      const hasValidEmb = isValidEmbedding(doc.embedding, expectedDim);

      if (doc.source === 'coedit' || (doc.originalText && doc.revisionText)) {
        transformations.push({
          id: doc._id.toString(),
          originalText: doc.originalText || '',
          revisionText: doc.revisionText || doc.text || '',
          task: doc.task || 'paraphrase',
          style: doc.style || 'Natural',
          tone: doc.tone || 'Natural',
          domain: doc.domain || 'General',
          complexity: doc.complexity || 'Medium',
          language: doc.language || 'English',
          source: doc.source || 'coedit',
          license: doc.license || 'CC BY-SA 4.0',
          embedding: hasValidEmb ? doc.embedding : null,
          embeddingModel: doc.embeddingModel || 'nomic-embed-text',
          embeddingVersion: doc.embeddingVersion || 1,
          embeddedAt: doc.embeddedAt || null,
        });
      } else {
        styles.push({
          id: doc._id.toString(),
          text: doc.text || '',
          style: doc.style || 'Natural',
          tone: doc.tone || 'Natural',
          domain: doc.domain || 'General',
          complexity: doc.complexity || 'Medium',
          language: doc.language || 'English',
          source: doc.source || 'ielts',
          license: doc.license || 'Academic/Open',
          metadata: doc.metadata || {},
          embedding: hasValidEmb ? doc.embedding : null,
          embeddingModel: doc.embeddingModel || 'nomic-embed-text',
          embeddingVersion: doc.embeddingVersion || 1,
          embeddedAt: doc.embeddedAt || null,
        });
      }
    }

    // Ensure directory exists
    const dir = path.dirname(retrievalJsonlPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Write retrieval_examples.jsonl
    const retLines = transformations.map((t) => JSON.stringify(t)).join('\n');
    fs.writeFileSync(retrievalJsonlPath, retLines, 'utf8');
    console.log(`✅ Saved ${transformations.length} transformation examples to ${retrievalJsonlPath}`);

    // Write styleExamples.jsonl
    const styleLines = styles.map((s) => JSON.stringify(s)).join('\n');
    fs.writeFileSync(styleJsonlPath, styleLines, 'utf8');
    console.log(`✅ Saved ${styles.length} style examples to ${styleJsonlPath}`);
  } catch (err) {
    console.error(`❌ JSONL sync failed:`, err.message);
  }
}

run().catch((err) => {
  console.error('❌ Embedding script fatal error:', err);
  process.exit(1);
});
