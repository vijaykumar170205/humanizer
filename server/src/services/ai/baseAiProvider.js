/**
 * Abstract Base AI Provider Interface
 * All concrete providers (Gemini, OpenAI, Anthropic, Mock) must implement these methods.
 */
export class BaseAiProvider {
  constructor(name = 'BaseProvider') {
    this.name = name;
  }

  /**
   * Generate raw completion given a system prompt and user prompt
   */
  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error(`generateText() must be implemented by ${this.name}`);
  }

  /**
   * Generate structured JSON output
   */
  async generateJSON({ systemPrompt, userPrompt, temperature = 0.3 }) {
    throw new Error(`generateJSON() must be implemented by ${this.name}`);
  }

  /**
   * Check provider health / connectivity
   */
  async healthCheck() {
    return { provider: this.name, status: 'unknown' };
  }
}

export default BaseAiProvider;
