import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { countWords, calculateDiff } from '../src/utils/textProcessor.js';

describe('Humanly AI Backend Tests', () => {
  test('GET /api/health should return status online', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'online');
  });

  test('Text processing countWords and calculateDiff', () => {
    const text1 = 'Artificial intelligence transforms modern writing.';
    const text2 = 'Smart artificial intelligence transforms natural human writing.';

    assert.strictEqual(countWords(text1), 5);
    assert.strictEqual(countWords(text2), 7);

    const diffResult = calculateDiff(text1, text2);
    assert.strictEqual(typeof diffResult.stats.similarityPercentage, 'number');
    assert.strictEqual(diffResult.diffChunks.length > 0, true);
  });

  test('POST /api/rewrite with arbitrary everyday text should dynamically transform sentence structure', async () => {
    const original = 'We went to the beach because the weather was very sunny and we wanted to play volleyball.';
    const res = await request(app)
      .post('/api/rewrite')
      .send({
        text: original,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.rewrittenText, 'string');
    // Verify that the output is not identical to the input and has been genuinely rewritten
    assert.notStrictEqual(res.body.data.rewrittenText, original);
    assert.strictEqual(res.body.data.diff.stats.similarityPercentage < 100, true);
  });

  test('POST /api/rewrite/paraphrase across different modes produces distinct variations', async () => {
    const original = 'Due to the fact that modern algorithms exhibit substantial accuracy, we must utilize them in order to help people.';
    
    const resAcademic = await request(app)
      .post('/api/rewrite/paraphrase')
      .send({ text: original, mode: 'Academic' });

    const resSimple = await request(app)
      .post('/api/rewrite/paraphrase')
      .send({ text: original, mode: 'Simple' });

    assert.strictEqual(resAcademic.status, 200);
    assert.strictEqual(resSimple.status, 200);
    assert.notStrictEqual(resAcademic.body.data.paraphrasedText, resSimple.body.data.paraphrasedText);
  });

  test('POST /api/rewrite/sentence returns 3 distinct styled options', async () => {
    const res = await request(app)
      .post('/api/rewrite/sentence')
      .send({
        sentence: 'It is important to remember that reading every day helps improve your vocabulary.',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Array.isArray(res.body.data.variations), true);
    assert.strictEqual(res.body.data.variations.length >= 3, true);
  });

  test('POST /api/tools/grammar/check should return structured grammar analysis', async () => {
    const res = await request(app)
      .post('/api/tools/grammar/check')
      .send({
        text: 'Their is some issues in order to recieve the email definately.',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.readabilityScore, 'number');
    assert.strictEqual(res.body.data.corrections.length >= 3, true);
  });

  test('POST /api/tools/detector/analyze should return AI likelihood estimate', async () => {
    const res = await request(app)
      .post('/api/tools/detector/analyze')
      .send({
        text: 'Furthermore, it is crucial to examine the multifaceted dimensions of algorithmic systems. In conclusion, it delves into modern tasks.',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.aiLikelihood, 'number');
    assert.strictEqual(typeof res.body.data.humanLikelihood, 'number');
    assert.strictEqual(res.body.data.aiLikelihood + res.body.data.humanLikelihood, 100);
  });

  test('POST /api/tools/essay/generate generates structured multi-section markdown essay', async () => {
    const res = await request(app)
      .post('/api/tools/essay/generate')
      .send({
        topic: 'Renewable Energy Storage',
        academicLevel: 'Undergraduate / College',
        targetWordCount: 500,
        citationStyle: 'APA 7th Edition',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(/#.*Introduction/i.test(res.body.data.essayContent), true);
    assert.strictEqual(res.body.data.wordCount > 100, true);
  });

  test('POST /api/rewrite with large multi-paragraph text processes without errors', async () => {
    const longText = Array(15).fill('In conclusion, it is important to remember that continuous improvement drives innovation across modern ecosystems. Furthermore, we must optimize our workflows carefully.').join('\n\n');

    const res = await request(app)
      .post('/api/rewrite')
      .send({
        text: longText,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.rewrittenText, 'string');
    assert.strictEqual(res.body.data.rewrittenText.length > 0, true);
  });

  test('POST /api/chat should respond with conversational assistant reply', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'How can I make my academic writing more concise?',
        history: [],
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.reply, 'string');
    assert.strictEqual(res.body.reply.length > 0, true);
    assert.strictEqual(typeof res.body.provider, 'string');
    assert.strictEqual(typeof res.body.model, 'string');
  });

  test('GET /api/chat/status should return chat service status', async () => {
    const res = await request(app).get('/api/chat/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.service, 'Humanoider Chatbot');
  });
});
