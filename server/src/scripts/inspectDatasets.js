import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDataDir = path.resolve(__dirname, '../../data/raw');

const files = {
  coeditTrain: path.join(baseDataDir, 'coedit/train.jsonl'),
  coeditVal: path.join(baseDataDir, 'coedit/validation.jsonl'),
  ieltsTrain: path.join(baseDataDir, 'ielts/train.csv'),
  ieltsTest: path.join(baseDataDir, 'ielts/test.csv'),
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content) {
  const rows = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentRow += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentRow += char;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentRow.trim()) {
        rows.push(parseCSVLine(currentRow));
      }
      currentRow = '';
    } else if (char === '\r' && !inQuotes) {
      // ignore \r
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) {
    rows.push(parseCSVLine(currentRow));
  }
  return rows;
}

async function inspectCoedit(filePath, label) {
  console.log(`\n======================================================`);
  console.log(`📊 INSPECTING: ${label}`);
  console.log(`   Path: ${filePath}`);
  console.log(`======================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const stat = fs.statSync(filePath);
  console.log(`Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let missingSrc = 0;
  let missingTgt = 0;
  let missingTask = 0;
  const taskCounts = {};
  const sampleRecords = [];
  const taskPrefixes = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    count++;
    try {
      const obj = JSON.parse(line);
      if (!obj.src) missingSrc++;
      if (!obj.tgt) missingTgt++;
      if (!obj.task) missingTask++;

      const task = obj.task || 'unknown';
      taskCounts[task] = (taskCounts[task] || 0) + 1;

      // Detect prefix in src
      if (obj.src) {
        const colonIdx = obj.src.indexOf(':');
        if (colonIdx > 0 && colonIdx < 60) {
          const prefix = obj.src.substring(0, colonIdx).trim();
          taskPrefixes[prefix] = (taskPrefixes[prefix] || 0) + 1;
        }
      }

      if (sampleRecords.length < 3) {
        sampleRecords.push(obj);
      }
    } catch (err) {
      console.warn(`Error parsing line ${count}:`, err.message);
    }
  }

  console.log(`Total Records:    ${count}`);
  console.log(`Missing 'src':    ${missingSrc}`);
  console.log(`Missing 'tgt':    ${missingTgt}`);
  console.log(`Missing 'task':   ${missingTask}`);
  console.log(`\n--- Task Distribution ---`);
  console.table(taskCounts);

  console.log(`\n--- Top Instruction Prefixes in 'src' ---`);
  const topPrefixes = Object.entries(taskPrefixes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  console.table(Object.fromEntries(topPrefixes));

  console.log(`\n--- Sample Records ---`);
  console.log(JSON.stringify(sampleRecords, null, 2));
}

function inspectIelts(filePath, label) {
  console.log(`\n======================================================`);
  console.log(`📊 INSPECTING: ${label}`);
  console.log(`   Path: ${filePath}`);
  console.log(`======================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const stat = fs.statSync(filePath);
  console.log(`Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);

  if (rows.length === 0) {
    console.warn(`Empty CSV file!`);
    return;
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`Header columns (${header.length}):`, header.join(', '));
  console.log(`Total Data Rows: ${dataRows.length}`);

  const bandIndex = header.indexOf('band');
  const essayIndex = header.indexOf('essay');
  const promptIndex = header.indexOf('prompt');

  const bandCounts = {};
  let missingEssay = 0;
  let missingPrompt = 0;
  let missingBand = 0;
  let totalWordCount = 0;

  dataRows.forEach((r) => {
    const prompt = promptIndex >= 0 ? r[promptIndex] : '';
    const essay = essayIndex >= 0 ? r[essayIndex] : '';
    const band = bandIndex >= 0 ? parseFloat(r[bandIndex]) : NaN;

    if (!essay || !essay.trim()) missingEssay++;
    if (!prompt || !prompt.trim()) missingPrompt++;
    if (isNaN(band)) missingBand++;

    if (!isNaN(band)) {
      const bKey = band.toFixed(1);
      bandCounts[bKey] = (bandCounts[bKey] || 0) + 1;
    }

    if (essay) {
      totalWordCount += essay.split(/\s+/).filter(Boolean).length;
    }
  });

  const avgWords = dataRows.length > 0 ? Math.round(totalWordCount / (dataRows.length - missingEssay || 1)) : 0;

  console.log(`Missing Prompts: ${missingPrompt}`);
  console.log(`Missing Essays:  ${missingEssay}`);
  console.log(`Missing Bands:   ${missingBand}`);
  console.log(`Average Essay Word Count: ${avgWords} words`);

  console.log(`\n--- IELTS Band Score Distribution ---`);
  console.table(bandCounts);

  console.log(`\n--- Sample Record (Row 1) ---`);
  if (dataRows[0]) {
    const sample = {};
    header.forEach((h, idx) => {
      sample[h] = dataRows[0][idx]?.length > 200 ? dataRows[0][idx].substring(0, 200) + '...' : dataRows[0][idx];
    });
    console.log(sample);
  }
}

async function main() {
  console.log(`🚀 Starting Comprehensive Dataset Inspection...`);
  await inspectCoedit(files.coeditTrain, 'CoEdIT Train (train.jsonl)');
  await inspectCoedit(files.coeditVal, 'CoEdIT Validation (validation.jsonl)');
  inspectIelts(files.ieltsTrain, 'IELTS Task 2 Train (train.csv)');
  inspectIelts(files.ieltsTest, 'IELTS Task 2 Test (test.csv)');
  console.log(`\n✅ Dataset Inspection Complete!`);
}

main().catch(console.error);
