import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import StyleExample from '../models/StyleExample.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_DIM = 768;
const EXPECTED_MODEL = config.ollama.embedModel || 'nomic-embed-text';

const retrievalJsonlPath = path.resolve(__dirname, '../../data/final/retrieval_examples.jsonl');
const styleJsonlPath = path.resolve(__dirname, '../../data/final/styleExamples.jsonl');

async function validate() {
  await mongoose.connect(config.mongoUri);

  const total = await StyleExample.countDocuments();
  let validCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  let dimensionMismatches = 0;
  let duplicateIds = 0;
  const problems = [];

  const seenIds = new Set();
  const cursor = StyleExample.find({}).cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const idStr = doc._id.toString();
    if (seenIds.has(idStr)) {
      duplicateIds++;
      problems.push(`Duplicate MongoDB _id: ${idStr}`);
    }
    seenIds.add(idStr);

    const emb = doc.embedding;
    if (!emb || !Array.isArray(emb) || emb.length === 0) {
      missingCount++;
      problems.push(`Doc ${idStr} is missing embedding`);
      continue;
    }

    if (emb.length !== EXPECTED_DIM) {
      dimensionMismatches++;
      problems.push(`Doc ${idStr} dimension mismatch: expected ${EXPECTED_DIM}, got ${emb.length}`);
      continue;
    }

    let hasInvalidNumber = false;
    for (let i = 0; i < emb.length; i++) {
      if (typeof emb[i] !== 'number' || !Number.isFinite(emb[i])) {
        hasInvalidNumber = true;
        break;
      }
    }

    if (hasInvalidNumber) {
      invalidCount++;
      problems.push(`Doc ${idStr} contains NaN or non-finite values`);
      continue;
    }

    validCount++;
  }

  // Also validate JSONL files if they exist
  let jsonlTotal = 0;
  let jsonlValid = 0;
  let jsonlMissing = 0;

  for (const filePath of [retrievalJsonlPath, styleJsonlPath]) {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter((l) => l.trim());
      jsonlTotal += lines.length;
      for (let i = 0; i < lines.length; i++) {
        try {
          const item = JSON.parse(lines[i]);
          if (Array.isArray(item.embedding) && item.embedding.length === EXPECTED_DIM) {
            jsonlValid++;
          } else {
            jsonlMissing++;
          }
        } catch (e) {
          jsonlMissing++;
        }
      }
    }
  }

  const isPass = total > 0 && missingCount === 0 && invalidCount === 0 && dimensionMismatches === 0 && duplicateIds === 0;

  console.log(`====================================`);
  console.log(`EMBEDDING DATASET VALIDATION`);
  console.log(`====================================\n`);
  console.log(`Total records:              ${String(total).padStart(4)}`);
  console.log(`Valid embeddings:           ${String(validCount).padStart(4)}`);
  console.log(`Missing embeddings:            ${String(missingCount).padStart(1)}`);
  console.log(`Invalid embeddings:            ${String(invalidCount).padStart(1)}`);
  console.log(`Dimension mismatches:          ${String(dimensionMismatches).padStart(1)}`);
  console.log(`Duplicate IDs:                ${String(duplicateIds).padStart(1)}\n`);
  console.log(`Embedding model:`);
  console.log(`${EXPECTED_MODEL}\n`);
  console.log(`Status:`);
  console.log(isPass ? 'PASS' : 'FAIL');
  console.log(`====================================`);

  if (!isPass && problems.length > 0) {
    console.log(`\n?????? Identified ${problems.length} issues (showing first 10):`);
    problems.slice(0, 10).forEach((p) => console.log(` - ${p}`));
  }

  await mongoose.disconnect();
  process.exit(isPass ? 0 : 1);
}

validate().catch((err) => {
  console.error('Validation error:', err.message);
  process.exit(1);
});
