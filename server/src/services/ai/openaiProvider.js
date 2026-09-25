import OpenAI from 'openai';
import { BaseAiProvider } from './baseAiProvider.js';
import { config } from '../../config/env.js';

export class OpenAIProvider extends BaseAiProvider {
  constructor() {
    super('openai');
    this.apiKey = config.ai.openaiApiKey;
    this.modelName = config.ai.openaiModel || 'gpt-4o-mini';
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_openai_api_key'));
  }

  async generateText({
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    top_p = null,
    frequency_penalty = null,
    presence_penalty = null,
    maxTokens = 2048,
  }) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is missing or not configured in environment variables.');
    }

    try {
      const payload = {
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      };

      if (top_p !== null && top_p !== undefined) payload.top_p = top_p;
      if (frequency_penalty !== null && frequency_penalty !== undefined) payload.frequency_penalty = frequency_penalty;
      if (presence_penalty !== null && presence_penalty !== undefined) payload.presence_penalty = presence_penalty;

      const completion = await this.client.chat.completions.create(payload);

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Provider generateText error:', error.message);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  async generateJSON({ systemPrompt, userPrompt, temperature = 0.2 }) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is missing or not configured in environment variables.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature,
      });

      const text = completion.choices[0]?.message?.content?.trim() || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error('OpenAI Provider generateJSON error:', error.message);
      throw new Error(`OpenAI JSON generation failed: ${error.message}`);
    }
  }

  async healthCheck() {
    return {
      provider: 'openai',
      model: this.modelName,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'ready' : 'unconfigured',
    };
  }
}

export default OpenAIProvider;
