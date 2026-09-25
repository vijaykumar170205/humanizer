import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import StyleExample from '../models/StyleExample.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultFile = fs.existsSync(path.resolve(__dirname, '../../../server/data/final/retrieval_examples.jsonl'))
  ? path.resolve(__dirname, '../../../server/data/final/retrieval_examples.jsonl')
  : path.resolve(__dirname, '../../../server/data/final/styleExamples.jsonl');

const targetFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultFile;

async function run() {
  console.log(`📥 [Dataset Importer] Connecting to MongoDB: ${config.mongoUri}`);
  await mongoose.connect(config.mongoUri);
  console.log(`✅ MongoDB Connected.`);

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Dataset file not found: ${targetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim());

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  console.log(`📥 Processing ${lines.length} records...`);

  for (let i = 0; i < lines.length; i++) {
    try {
      const record = JSON.parse(lines[i]);
      if (!record.text) continue;

      const cleanText = record.text.trim();
      const textHash = crypto.createHash('sha256').update(cleanText).digest('hex');

      const updateData = {
        text: cleanText,
        textHash,
        originalText: record.originalText || '',
        revisionText: record.revisionText || '',
        task: record.task || '',
        metadata: record.metadata || {},
        style: record.style || 'Natural',
        tone: record.tone || 'Natural',
        domain: record.domain || 'General',
        complexity: record.complexity || 'Medium',
        language: record.language || 'English',
        source: record.source || 'original',
        sourceId: record.sourceId || '',
        license: record.license || 'original',
      };

      if (record.embedding && Array.isArray(record.embedding)) {
        updateData.embedding = record.embedding;
      }

      const res = await StyleExample.updateOne(
        { textHash },
        { $set: updateData },
        { upsert: true }
      );

      if (res.upsertedCount > 0) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    } catch (err) {
      errorCount++;
      console.warn(`Record ${i + 1} import error:`, err.message);
    }
  }

  const totalInDb = await StyleExample.countDocuments();

  console.log(`\n================ DATASET IMPORT SUMMARY ================`);
  console.log(`New records inserted:  ${insertedCount}`);
  console.log(`Existing updated:      ${updatedCount}`);
  console.log(`Errors encountered:    ${errorCount}`);
  console.log(`Total in database:     ${totalInDb}`);

  await mongoose.disconnect();
  console.log(`🔌 Disconnected from MongoDB. Import complete.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
