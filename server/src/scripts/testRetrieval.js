import mongoose from 'mongoose';
import { retriever } from '../services/retrieval/retriever.js';
import { vectorStore } from '../services/retrieval/vectorStore.js';
import { config } from '../config/env.js';

const testQueries = [
  {
    category: 'Test 1 ??? Education',
    query: 'Students are increasingly using online resources to improve their learning.',
  },
  {
    category: 'Test 2 ??? Technology',
    query: 'Artificial intelligence is changing the way people work.',
  },
  {
    category: 'Test 3 ??? Daily life',
    query: 'I usually prefer studying in the evening because it is quieter.',
  },
  {
    category: 'Test 4 ??? Academic writing',
    query: 'The results demonstrate that regular practice improves performance.',
  },
  {
    category: 'Test 5 ??? Conversational',
    query: "I didn't really understand the topic at first, but eventually it became easier.",
  },
];

async function runTests() {
  console.log('??? Initializing database and vector store...');
  await mongoose.connect(config.mongoUri);
  await vectorStore.initialize();

  const stats = vectorStore.getStats();
  console.log(`???? VectorStore Stats: totalIndexed=${stats.totalIndexed}, withEmbeddings=${stats.withEmbeddings}\n`);

  for (const t of testQueries) {
    console.log(`======================================================`);
    console.log(`### ${t.category}`);
    console.log(`QUERY: "${t.query}"`);
    console.log('-----');

    const result = await retriever.retrieve({
      text: t.query,
      language: 'English',
    });

    const candidates = result.examples || [];

    if (candidates.length === 0) {
      console.log('No matching examples retrieved.\n');
      continue;
    }

    candidates.slice(0, 3).forEach((ex, idx) => {
      const sim = ex.semanticScore !== undefined ? ex.semanticScore.toFixed(4) : (ex.finalScore !== undefined ? ex.finalScore.toFixed(4) : 'N/A');
      const text = (ex.revisionText || ex.text || ex.originalText || '').trim();
      console.log(`RESULT #${idx + 1}`);
      console.log(`Similarity: ${sim}`);
      console.log(`Task:       ${ex.task || 'style-reference'}`);
      console.log(`Source:     ${ex.source || 'unknown'}`);
      console.log(`Text:       ${text.length > 120 ? text.slice(0, 120) + '...' : text}`);
      console.log('');
    });
  }

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test retrieval error:', err);
  process.exit(1);
});
