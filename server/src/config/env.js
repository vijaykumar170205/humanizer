import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server or root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/humanly_db',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'humanly_secure_jwt_secret_development_key_8899',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'humanly_cookie_secret_key_2026',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  ai: {
    provider: (process.env.AI_PROVIDER || 'ollama').toLowerCase(),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  ollama: {
    enabled: process.env.OLLAMA_ENABLED !== 'false',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '120000', 10),
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.94'),
    top_p: parseFloat(process.env.OLLAMA_TOP_P || '0.94'),
    top_k: parseInt(process.env.OLLAMA_TOP_K || '40', 10),
    repeat_penalty: parseFloat(process.env.OLLAMA_REPEAT_PENALTY || '1.18'),
    frequency_penalty: parseFloat(process.env.OLLAMA_FREQUENCY_PENALTY || '0.55'),
    presence_penalty: parseFloat(process.env.OLLAMA_PRESENCE_PENALTY || '0.40'),
    min_p: parseFloat(process.env.OLLAMA_MIN_P || '0.04'),
  },

  retrieval: {
    enabled: process.env.RETRIEVAL_ENABLED !== 'false',
    topK: parseInt(process.env.RETRIEVAL_TOP_K || '5', 10),
    candidateK: parseInt(process.env.RETRIEVAL_CANDIDATE_K || '20', 10),
    styleThreshold: parseFloat(process.env.RETRIEVAL_STYLE_THRESHOLD || '0.35'),
    weights: {
      semantic: parseFloat(process.env.RANKING_WEIGHT_SEMANTIC || '0.85'),
      domain: parseFloat(process.env.RANKING_WEIGHT_DOMAIN || '0.075'),
      complexity: parseFloat(process.env.RANKING_WEIGHT_COMPLEXITY || '0.075'),
    },
  },

  validation: {
    maxRetries: parseInt(process.env.MAX_REWRITE_RETRIES || '2', 10),
    minSemanticSimilarity: parseFloat(process.env.MIN_SEMANTIC_SIMILARITY || '0.65'),
    strictProtectedContent: process.env.STRICT_PROTECTED_CONTENT !== 'false',
  },

  vectorSearch: {
    enabled: process.env.VECTOR_SEARCH_ENABLED !== 'false',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '150', 10),
    rewriteMax: parseInt(process.env.REWRITE_RATE_LIMIT_MAX || '40', 10),
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedExtensions: (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,txt,md').split(','),
  },

  plans: {
    free: {
      monthlyWordLimit: 10000,
      maxFileSizeBytes: 5242880, // 5MB
      features: ['humanizer', 'paraphraser', 'grammar', 'detector', 'sentence', 'paragraph']
    },
    pro: {
      monthlyWordLimit: 100000,
      maxFileSizeBytes: 10485760, // 10MB
      features: ['humanizer', 'paraphraser', 'grammar', 'detector', 'essay', 'sentence', 'paragraph', 'article', 'priority_speed']
    },
    business: {
      monthlyWordLimit: 500000,
      maxFileSizeBytes: 20971520, // 20MB
      features: ['all', 'team_management', 'api_access', 'priority_speed']
    }
  }
};
