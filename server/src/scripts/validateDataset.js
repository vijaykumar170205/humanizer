import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../../../server/data/final/styleExamples.jsonl');

console.log(`🔍 [Dataset Validator] Inspecting: ${targetFile}`);

if (!fs.existsSync(targetFile)) {
  console.error(`❌ Dataset file does not exist: ${targetFile}`);
  process.exit(1);
}

const ALLOWED_STYLES = new Set(['natural', 'professional', 'conversational', 'simple', 'detailed', 'storytelling', 'standard', 'flowing', 'structured']);
const ALLOWED_TONES = new Set(['natural', 'professional', 'casual', 'friendly', 'academic', 'persuasive', 'creative', 'concise', 'warm', 'direct', 'conversational']);
const ALLOWED_DOMAINS = new Set(['technology', 'education', 'business', 'science', 'daily life', 'general']);
const ALLOWED_COMPLEXITIES = new Set(['simple', 'medium', 'advanced']);

const content = fs.readFileSync(targetFile, 'utf8');
const lines = content.split('\n').filter((l) => l.trim());

let validCount = 0;
let invalidCount = 0;
let duplicateCount = 0;
const errors = [];
const seenHashes = new Set();
const stats = {
  styles: {},
  tones: {},
  domains: {},
  complexities: {},
};

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  let record;
  try {
    record = JSON.parse(line);
  } catch (err) {
    invalidCount++;
    errors.push(`Line ${lineNum}: Invalid JSON syntax.`);
    return;
  }

  // Text validation
  if (!record.text || typeof record.text !== 'string' || record.text.trim().length < 15) {
    invalidCount++;
    errors.push(`Line ${lineNum}: Missing or overly short text.`);
    return;
  }

  const wordCount = record.text.trim().split(/\s+/).length;
  if (wordCount < 4) {
    invalidCount++;
    errors.push(`Line ${lineNum}: Text has too few words (${wordCount} words).`);
    return;
  }

  // Deduplication check
  const hash = crypto.createHash('sha256').update(record.text.trim().toLowerCase()).digest('hex');
  if (seenHashes.has(hash)) {
    duplicateCount++;
    errors.push(`Line ${lineNum}: Duplicate text detected.`);
    return;
  }
  seenHashes.add(hash);

  // Metadata validation
  const style = (record.style || '').toLowerCase();
  const tone = (record.tone || '').toLowerCase();
  const domain = (record.domain || 'general').toLowerCase();
  const complexity = (record.complexity || 'medium').toLowerCase();

  if (!ALLOWED_STYLES.has(style)) {
    errors.push(`Line ${lineNum}: Unknown style '${record.style}' (defaulting allowed).`);
  }
  if (!ALLOWED_TONES.has(tone)) {
    errors.push(`Line ${lineNum}: Unknown tone '${record.tone}' (defaulting allowed).`);
  }

  // Record stats
  stats.styles[record.style] = (stats.styles[record.style] || 0) + 1;
  stats.tones[record.tone] = (stats.tones[record.tone] || 0) + 1;
  stats.domains[record.domain] = (stats.domains[record.domain] || 0) + 1;
  stats.complexities[record.complexity] = (stats.complexities[record.complexity] || 0) + 1;

  validCount++;
});

console.log(`\n================ DATASET VALIDATION REPORT ================`);
console.log(`Total Records:     ${lines.length}`);
console.log(`Valid Records:     ${validCount}`);
console.log(`Invalid Records:   ${invalidCount}`);
console.log(`Duplicates Found:  ${duplicateCount}`);
console.log(`\n--- Styles Distribution ---`);
console.table(stats.styles);
console.log(`\n--- Tones Distribution ---`);
console.table(stats.tones);
console.log(`\n--- Domains Distribution ---`);
console.table(stats.domains);

if (errors.length > 0) {
  console.log(`\n⚠️ Identified ${errors.length} notices/errors (showing first 5):`);
  errors.slice(0, 5).forEach((e) => console.log(` - ${e}`));
}

if (invalidCount === 0 && duplicateCount === 0) {
  console.log(`\n✨ Dataset validation PASSED successfully! 100% compliant.`);
  process.exit(0);
} else {
  console.log(`\n⚠️ Dataset validation completed with ${invalidCount} invalid and ${duplicateCount} duplicate records.`);
  process.exit(invalidCount > 0 ? 1 : 0);
}
