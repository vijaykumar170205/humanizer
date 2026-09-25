import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../../../server/data/final/styleExamples.jsonl');

const outputFile = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.resolve(__dirname, '../../../server/data/final/styleExamples.jsonl');

console.log(`🧹 [Dataset Cleaner] Reading from: ${inputFile}`);
console.log(`🧹 [Dataset Cleaner] Target output: ${outputFile}`);

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf8');
const lines = content.split('\n').filter((l) => l.trim());

const seenHashes = new Set();
const cleanedRecords = [];
let removedDuplicates = 0;
let removedGarbage = 0;

for (let i = 0; i < lines.length; i++) {
  let item;
  try {
    item = JSON.parse(lines[i]);
  } catch (err) {
    removedGarbage++;
    continue;
  }

  if (!item.text || typeof item.text !== 'string') {
    removedGarbage++;
    continue;
  }

  // Normalize whitespace
  const cleanText = item.text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length < 15 || cleanText.split(/\s+/).length < 4) {
    removedGarbage++;
    continue;
  }

  // Hash check for deduplication
  const hash = crypto.createHash('sha256').update(cleanText.toLowerCase()).digest('hex');
  if (seenHashes.has(hash)) {
    removedDuplicates++;
    continue;
  }
  seenHashes.add(hash);

  cleanedRecords.push({
    id: item.id || `ex_${cleanedRecords.length + 1}`,
    text: cleanText,
    style: item.style || 'Natural',
    tone: item.tone || 'Natural',
    domain: item.domain || 'General',
    complexity: item.complexity || 'Medium',
    language: item.language || 'English',
    source: item.source || 'original',
    sourceId: item.sourceId || '',
    license: item.license || 'original',
    embedding: item.embedding || undefined,
  });
}

const outputContent = cleanedRecords.map((r) => JSON.stringify(r)).join('\n');
fs.writeFileSync(outputFile, outputContent, 'utf8');

console.log(`\n================ DATASET CLEAN REPORT ================`);
console.log(`Initial records:      ${lines.length}`);
console.log(`Garbage removed:      ${removedGarbage}`);
console.log(`Duplicates removed:   ${removedDuplicates}`);
console.log(`Final clean records:  ${cleanedRecords.length}`);
console.log(`✨ Saved cleaned dataset to ${outputFile}`);
