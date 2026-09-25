# Humanoider — Retrieval-Augmented Local AI Writing Engine

<div align="center">
  <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80" alt="Humanoider Banner" width="700" style="border-radius: 16px; margin-bottom: 20px;" />
  <p><strong>Transform stiff, robotic, or AI-assisted drafts into natural, engaging writing with local LLMs, retrieval-augmented style matching, and meaning preservation.</strong></p>
</div>

---

## 🌟 Overview

**Humanoider** is a full-stack MERN SaaS web application featuring a **Modular Local Retrieval-Augmented Writing Engine**. Powered by **Local Ollama**, **Qwen 2.5 3B** for generation, and **`nomic-embed-text`** for semantic vectors, Humanoider refines sentence rhythm, cadence (burstiness), active voice, and vocabulary while strictly preserving all original facts, numerical figures, proper names, citations, and terminology.

---

## 🏗️ Writing Engine Architecture

```
User Input Text (Studio / API)
        ↓
Text Analyzer (Metrics, Readability, Protected Content: URLs, Emails, Numbers, Citations, Code)
        ↓
Embedding Service (nomic-embed-text via Ollama HTTP API with SHA-256 cache)
        ↓
Vector Store & In-Memory Index (Cosine similarity search over style examples)
        ↓
Hybrid Ranking Service (Weighted Score: Semantic 50%, Style 20%, Tone 15%, Domain 10%, Complexity 5%)
        ↓
Prompt Builder (Injects top K style reference examples into isolated context)
        ↓
OllamaProvider (Local Qwen 2.5 3B Generation via HTTP API)
        ↓
Output Validator (Checks protected entity preservation, length adherence, semantic similarity)
        ↓ (If validation fails: automated corrective retry up to MAX_REWRITE_RETRIES)
Result + Full Diagnostic Metadata
        ↓ (If Ollama / Model unavailable: multi-tier fallback)
Cloud Provider (Gemini / OpenAI) or Smart Linguistic Engine (MockAiProvider)
```

---

## 🛠️ Technology Stack

### Frontend
- **React.js 18+** with **Vite** for fast HMR and optimized builds
- **Tailwind CSS** with Dark Mode and Light Mode support
- **Lucide React** icons
- **Axios** with JWT authentication interceptors
- **Context API** (`AuthContext`, `RewriterContext`, `ToastContext`, `ThemeContext`)

### Backend & AI Engine
- **Node.js** & **Express.js** (ES Modules)
- **Local Ollama HTTP API**:
  - Generation Model: **`qwen2.5:3b`**
  - Embedding Model: **`nomic-embed-text`** (768 dimensions)
- **MongoDB & Mongoose**: StyleExample schema, RewriteHistory, User Quotas
- **In-Memory Vector Search**: High-performance cosine similarity index
- **Multi-tier Fallback**: Seamless fallback to Gemini, OpenAI, or Smart Linguistic Engine
- **Multer, pdf-parse, mammoth**: Secure memory-safe document text extraction

---

## ⚡ Local Setup & Ollama Installation

### 1. Install & Pull Ollama Models

Install [Ollama](https://ollama.com) and pull the generation and embedding models:

```bash
# Pull Qwen 2.5 3B local generation model
ollama pull qwen2.5:3b

# Pull nomic-embed-text local embedding model
ollama pull nomic-embed-text
```

### 2. Install Project Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default local configuration:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/humanly_db

# Local Ollama Provider
AI_PROVIDER=ollama
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_TIMEOUT=120000
OLLAMA_TEMPERATURE=0.6

# Retrieval & Hybrid Ranking
RETRIEVAL_ENABLED=true
RETRIEVAL_TOP_K=5
RETRIEVAL_CANDIDATE_K=20
RANKING_WEIGHT_SEMANTIC=0.50
RANKING_WEIGHT_STYLE=0.20
RANKING_WEIGHT_TONE=0.15
RANKING_WEIGHT_DOMAIN=0.10
RANKING_WEIGHT_COMPLEXITY=0.05

# Validation
MAX_REWRITE_RETRIES=2
MIN_SEMANTIC_SIMILARITY=0.65
STRICT_PROTECTED_CONTENT=true
```

---

## 📊 Dataset Management Commands

The system utilizes the **RAID dataset**: human-written text paired with AI-generated text on the same source content, used to build both `retrieval_examples.jsonl` (transformation pairs) and `styleExamples.jsonl` (natural human style references).

```bash
# Stream RAID dataset from Hugging Face and build retrieval and style datasets
npm run dataset:build

# Clean and normalize records, remove duplicates, and strip malformed rows
npm run dataset:clean

# Validate dataset JSONL syntax, deduplication, and schema compliance
npm run dataset:validate

# Idempotently import dataset into MongoDB StyleExample collection
npm run dataset:import

# Batch-generate 768-dim embeddings with nomic-embed-text (resumable)
npm run dataset:embed

# Run benchmark evaluation suite
npm run engine:eval
```

---

## 🚀 Running the Application

```bash
# Run both Backend API (:5000) and Frontend Client (:5173) concurrently
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Verification

Run server unit and integration tests (17 test suites covering Ollama, Retrieval, TextAnalyzer, OutputValidator, and fallback resiliency):

```bash
npm run test:server
```

Run frontend production build verification:

```bash
npm run build
```

---

## 🔧 Troubleshooting

### 1. Ollama Not Reachable
- **Symptom**: `⚠️ Ollama request timed out` or `fetch failed`.
- **Solution**: Start Ollama by running `ollama serve` in a terminal or launching the Ollama desktop application. The system automatically falls back to secondary cloud providers or the offline linguistic engine if Ollama is offline.

### 2. Model Not Installed
- **Symptom**: `model 'qwen2.5:3b' not found` or `model 'nomic-embed-text' not found`.
- **Solution**: Run `ollama pull qwen2.5:3b` and `ollama pull nomic-embed-text`.

### 3. MongoDB Vector Search Unavailable
- **Symptom**: Standalone local MongoDB without Atlas Vector Search.
- **Solution**: The built-in `VectorStore` automatically uses the in-memory cosine similarity engine loaded directly from the database records or `server/data/final/styleExamples.jsonl` fallback.

---

## 📄 License

This project is open-source software licensed under the **MIT License**.
