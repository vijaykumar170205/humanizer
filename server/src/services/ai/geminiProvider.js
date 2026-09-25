import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAiProvider } from './baseAiProvider.js';
import { config } from '../../config/env.js';

export class GeminiProvider extends BaseAiProvider {
  constructor() {
    super('gemini');
    this.apiKey = config.ai.geminiApiKey;
    this.modelName = config.ai.geminiModel || 'gemini-1.5-flash';
    this.client = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_gemini_api_key'));
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 }) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is missing or not configured in environment variables.');
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Provider generateText error:', error.message);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  async generateJSON({ systemPrompt, userPrompt, temperature = 0.2 }) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is missing or not configured in environment variables.');
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt + '\nEnsure output is pure, valid JSON without code fences or quotes.',
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean possible stray markdown fences
      const cleaned = text.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Gemini Provider generateJSON error:', error.message);
      throw new Error(`Gemini JSON generation failed: ${error.message}`);
    }
  }

  async healthCheck() {
    return {
      provider: 'gemini',
      model: this.modelName,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'ready' : 'unconfigured',
    };
  }
}

export default GeminiProvider;
