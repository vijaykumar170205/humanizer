import { config } from '../../config/env.js';
import { OllamaProvider } from './ollamaProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { MockAiProvider } from './mockAiProvider.js';

class AIProviderFactory {
  /**
   * Resolve appropriate AI provider based on preference & availability
   */
  static getProvider(overrideProviderName = null) {
    const providerType = (overrideProviderName || config.ai.provider || 'ollama').toLowerCase();

    switch (providerType) {
      case 'ollama': {
        const ollama = new OllamaProvider();
        if (ollama.isConfigured()) {
          return ollama;
        }
        // If Ollama is disabled, check cloud providers before mock
        return this.getCloudOrMockFallback('Ollama is disabled in configuration.');
      }

      case 'gemini': {
        const gemini = new GeminiProvider();
        if (gemini.isConfigured()) {
          return gemini;
        }
        return this.getCloudOrMockFallback('Gemini API key not configured.');
      }

      case 'openai': {
        const openai = new OpenAIProvider();
        if (openai.isConfigured()) {
          return openai;
        }
        return this.getCloudOrMockFallback('OpenAI API key not configured.');
      }

      case 'mock':
      default:
        return new MockAiProvider();
    }
  }

  /**
   * Helper to find next best available provider
   */
  static getCloudOrMockFallback(reason = '') {
    const gemini = new GeminiProvider();
    if (gemini.isConfigured()) {
      console.warn(`⚠️ ${reason} Falling back to Gemini.`);
      return gemini;
    }

    const openai = new OpenAIProvider();
    if (openai.isConfigured()) {
      console.warn(`⚠️ ${reason} Falling back to OpenAI.`);
      return openai;
    }

    console.warn(`⚠️ ${reason} Falling back to Smart Linguistic Engine (MockAiProvider).`);
    return new MockAiProvider();
  }

  /**
   * Check status of all supported providers
   */
  static async getProvidersStatus() {
    const ollama = new OllamaProvider();
    const gemini = new GeminiProvider();
    const openai = new OpenAIProvider();
    const mock = new MockAiProvider();

    const [ollamaStatus, geminiStatus, openaiStatus, mockStatus] = await Promise.all([
      ollama.healthCheck(),
      gemini.healthCheck(),
      openai.healthCheck(),
      mock.healthCheck(),
    ]);

    return {
      activeProvider: config.ai.provider,
      providers: {
        ollama: ollamaStatus,
        gemini: geminiStatus,
        openai: openaiStatus,
        mock: mockStatus,
      },
    };
  }
}

export { AIProviderFactory, AIProviderFactory as aiProviderFactory };
export default AIProviderFactory;
