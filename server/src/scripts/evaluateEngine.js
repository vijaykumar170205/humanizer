import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AIService from '../services/ai/aiService.js';
import { countWords } from '../utils/textProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testCasesPath = path.resolve(__dirname, '../../../server/data/evaluation/testCases.jsonl');

// Parse CLI args
const args = process.argv.slice(2);
let limit = Infinity;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  }
}

async function run() {
  console.log(`\n================ EVALUATION BENCHMARK SUITE ================`);
  console.log(`📂 Loading test cases from: ${testCasesPath}`);

  if (!fs.existsSync(testCasesPath)) {
    console.error(`❌ Test cases file not found at ${testCasesPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(testCasesPath, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim());
  let testCases = lines.map((l) => JSON.parse(l));

  if (isFinite(limit) && limit > 0) {
    testCases = testCases.slice(0, limit);
    console.log(`⚡ Limit applied: evaluating ${testCases.length} benchmarks.`);
  } else {
    console.log(`🧪 Running all ${testCases.length} evaluation benchmarks...\n`);
  }

  let passedCases = 0;
  let totalLatency = 0;
  let totalProtectedTested = 0;
  let totalProtectedPreserved = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const startTime = Date.now();

    try {
      const res = await AIService.rewrite({
        text: tc.text,
        tone: tc.targetTone || 'Natural',
        style: tc.targetStyle || 'Natural',
        domain: tc.domain || 'General',
        length: tc.length || 'same',
      });

      const latencyMs = Date.now() - startTime;
      totalLatency += latencyMs;

      // Check protected entities
      let protectedPassed = true;
      const expected = tc.expectedProtected || [];
      if (expected.length > 0) {
        totalProtectedTested += expected.length;
        for (const item of expected) {
          const cleanItem = item.replace(/[`()\[\]]/g, '').trim();
          if (res.rewrittenText.includes(cleanItem) || res.rewrittenText.includes(item)) {
            totalProtectedPreserved++;
          } else {
            protectedPassed = false;
          }
        }
      }

      const casePassed = protectedPassed && res.rewrittenWordCount > 0;
      if (casePassed) passedCases++;

      results.push({
        id: tc.id,
        name: tc.name,
        tone: tc.targetTone,
        style: tc.targetStyle,
        latencyMs,
        provider: res.metadata?.provider,
        retrievedCount: res.metadata?.retrieval?.examplesRetrieved ?? 0,
        protectedPreserved: expected.length > 0 ? (protectedPassed ? '✅ 100%' : '⚠️ Partial') : 'N/A',
        status: casePassed ? 'PASS' : 'WARN',
      });

      process.stdout.write(`\r[${i + 1}/${testCases.length}] Evaluated: ${tc.name} (${latencyMs}ms)...`);
    } catch (err) {
      results.push({
        id: tc.id,
        name: tc.name,
        latencyMs: Date.now() - startTime,
        status: 'FAIL',
        error: err.message,
      });
    }
  }

  console.log(`\n\n================ BENCHMARK RESULTS MATRIX ================`);
  console.table(results);

  const avgLatency = Math.round(totalLatency / (testCases.length || 1));
  const passRate = Math.round((passedCases / testCases.length) * 100);
  const protectedRate =
    totalProtectedTested > 0 ? Math.round((totalProtectedPreserved / totalProtectedTested) * 100) : 100;

  console.log(`\n================ AGGREGATE PERFORMANCE METRICS ================`);
  console.log(`Total Test Cases:               ${testCases.length}`);
  console.log(`Cases Passing Criteria:         ${passedCases}/${testCases.length} (${passRate}%)`);
  console.log(`Protected Content Accuracy:     ${totalProtectedPreserved}/${totalProtectedTested} (${protectedRate}%)`);
  console.log(`Average Latency per Rewrite:    ${avgLatency} ms`);
  console.log(`================================================================\n`);

  process.exit(passRate >= 75 ? 0 : 1);
}

run().catch((err) => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
