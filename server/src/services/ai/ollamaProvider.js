import { BaseAiProvider } from './baseAiProvider.js';
import { config } from '../../config/env.js';

export class OllamaProvider extends BaseAiProvider {
  constructor() {
    super('ollama');
    this.baseUrl = (config.ollama.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    this.modelName = config.ollama.model || 'qwen2.5:3b';
    this.timeout = config.ollama.timeout || 120000;
    this.defaultTemperature = config.ollama.temperature || 0.90;
    this.defaultTopP = config.ollama.top_p || 0.92;
    this.defaultTopK = config.ollama.top_k || 40;
    this.defaultRepeatPenalty = config.ollama.repeat_penalty || 1.15;
    this.defaultFrequencyPenalty = config.ollama.frequency_penalty || 0.50;
    this.defaultPresencePenalty = config.ollama.presence_penalty || 0.35;
    this.defaultMinP = config.ollama.min_p || 0.05;
  }

  isConfigured() {
    return Boolean(config.ollama.enabled);
  }

  /**
   * Helper to perform HTTP request to Ollama with timeout
   */
  async _request(endpoint, body, customTimeout = null) {
    const controller = new AbortController();
    const timeoutMs = customTimeout || this.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Text generation via Ollama Chat API with detector-bypassing sampling options
   */
  async generateText({
    systemPrompt,
    userPrompt,
    temperature = null,
    repeat_penalty = null,
    top_p = null,
    top_k = null,
    frequency_penalty = null,
    presence_penalty = null,
    min_p = null,
    maxTokens = 2048,
    options = {},
  }) {
    if (!this.isConfigured()) {
      throw new Error('Ollama provider is disabled in configuration.');
    }

    try {
      const messages = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt.trim() });
      }
      messages.push({ role: 'user', content: userPrompt });

      const samplingOptions = {
        temperature: temperature !== null ? temperature : (options.temperature ?? this.defaultTemperature),
        top_p: top_p !== null ? top_p : (options.top_p ?? this.defaultTopP),
        top_k: top_k !== null ? top_k : (options.top_k ?? this.defaultTopK),
        repeat_penalty: repeat_penalty !== null ? repeat_penalty : (options.repeat_penalty ?? this.defaultRepeatPenalty),
        frequency_penalty: frequency_penalty !== null ? frequency_penalty : (options.frequency_penalty ?? this.defaultFrequencyPenalty),
        presence_penalty: presence_penalty !== null ? presence_penalty : (options.presence_penalty ?? this.defaultPresencePenalty),
        min_p: min_p !== null ? min_p : (options.min_p ?? this.defaultMinP),
        num_predict: maxTokens,
      };

      const payload = {
        model: this.modelName,
        messages,
        stream: false,
        options: samplingOptions,
      };

      const data = await this._request('/api/chat', payload);
      const output = data.message?.content?.trim() || '';

      if (!output) {
        throw new Error('Ollama returned an empty generation response.');
      }

      return output;
    } catch (error) {
      console.error(`[OllamaProvider] generateText error (${this.modelName}):`, error.message);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Multi-turn chat conversation via Ollama Chat API
   */
  async generateChat({
    messages = [],
    temperature = null,
    repeat_penalty = null,
    maxTokens = 2048,
    options = {},
  }) {
    if (!this.isConfigured()) {
      throw new Error('Ollama provider is disabled in configuration.');
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array cannot be empty for chat generation.');
    }

    try {
      const samplingOptions = {
        temperature: temperature !== null ? temperature : (options.temperature ?? this.defaultTemperature),
        top_p: options.top_p ?? this.defaultTopP,
        top_k: options.top_k ?? this.defaultTopK,
        repeat_penalty: repeat_penalty !== null ? repeat_penalty : (options.repeat_penalty ?? this.defaultRepeatPenalty),
        min_p: options.min_p ?? this.defaultMinP,
        num_predict: maxTokens,
      };

      const payload = {
        model: this.modelName,
        messages: messages.map((m) => ({
          role: m.role || 'user',
          content: m.content || '',
        })),
        stream: false,
        options: samplingOptions,
      };

      const data = await this._request('/api/chat', payload);
      const output = data.message?.content?.trim() || '';

      if (!output) {
        throw new Error('Ollama returned an empty chat response.');
      }

      return output;
    } catch (error) {
      console.error(`[OllamaProvider] generateChat error (${this.modelName}):`, error.message);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  /**
   * Structured JSON generation via Ollama
   */
  async generateJSON({ systemPrompt, userPrompt, temperature = 0.2 }) {
    if (!this.isConfigured()) {
      throw new Error('Ollama provider is disabled in configuration.');
    }

    try {
      const messages = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({
          role: 'system',
          content: `${systemPrompt.trim()}\nIMPORTANT: You must respond in valid JSON format only without markdown fences.`,
        });
      }
      messages.push({ role: 'user', content: userPrompt });

      const payload = {
        model: this.modelName,
        messages,
        format: 'json',
        stream: false,
        options: {
          temperature,
        },
      };

      const data = await this._request('/api/chat', payload);
      const content = data.message?.content?.trim() || '{}';

      // Clean possible stray markdown fences
      const cleaned = content.replace(/^```(json)?\n?/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(`[OllamaProvider] generateJSON error (${this.modelName}):`, error.message);
      throw new Error(`Ollama JSON generation failed: ${error.message}`);
    }
  }

  /**
   * Check Ollama daemon and model availability
   */
  async healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          provider: 'ollama',
          baseUrl: this.baseUrl,
          configured: this.isConfigured(),
          reachable: false,
          status: `HTTP error ${res.status}`,
        };
      }

      const data = await res.json();
      const models = data.models || [];
      const modelNames = models.map((m) => m.name || m.model || '');

      const hasQwen = modelNames.some((n) => n.includes('qwen2.5') || n === this.modelName);
      const hasEmbed = modelNames.some((n) => n.includes('nomic-embed-text') || n === config.ollama.embedModel);

      return {
        provider: 'ollama',
        baseUrl: this.baseUrl,
        model: this.modelName,
        embedModel: config.ollama.embedModel,
        configured: this.isConfigured(),
        reachable: true,
        installedModels: modelNames,
        qwenAvailable: hasQwen,
        embedModelAvailable: hasEmbed,
        status: hasQwen ? 'ready' : 'model_missing',
      };
    } catch (err) {
      return {
        provider: 'ollama',
        baseUrl: this.baseUrl,
        model: this.modelName,
        configured: this.isConfigured(),
        reachable: false,
        error: err.message,
        status: 'unreachable',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default OllamaProvider;
