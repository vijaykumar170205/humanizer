import { AIProviderFactory } from '../ai/aiProviderFactory.js';
import { config } from '../../config/env.js';

const SYSTEM_PROMPT = `You are Humanoider AI, an intelligent, friendly, and expert writing assistant built directly into the Humanoider AI Writing platform.
You are running locally using Qwen 2.5 3B.

Your Mission & Capabilities:
1. Writing & Editing: Provide instant writing tips, grammar advice, vocabulary suggestions, and dynamic rewrites.
2. Tone & Style Guidance: Help users adapt their text for professional, academic, conversational, persuasive, or creative audiences.
3. Formatting: Format your answers clearly using clean Markdown (bullet points, bold highlights, code blocks when applicable).
4. Tone: Approachable, concise, encouraging, articulate, and direct. Avoid unnecessary verbose filler.
5. Platform Knowledge: When asked about Humanoider, explain that it is an advanced AI writing suite featuring retrieval-augmented humanization, intelligent paraphrasing, grammar checking, AI detection, and essay generation.

Always be helpful, thoughtful, and responsive to the user's questions and writing requests.`;

export class ChatService {
  constructor() {
    this.systemPrompt = SYSTEM_PROMPT;
  }

  /**
   * Process a user chat message with multi-turn history
   */
  async sendMessage({ message, history = [], conversationId = null, temperature = null }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('A non-empty message string is required.');
    }

    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();

    // 1. Sanitize history: strip out error messages and format
    const cleanHistory = Array.isArray(history)
      ? history
          .filter((h) => h && h.role && h.content && !String(h.content).startsWith('⚠️'))
          .slice(-10)
          .map((h) => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: String(h.content).trim(),
          }))
      : [];

    const formattedMessages = [
      { role: 'system', content: this.systemPrompt },
      ...cleanHistory,
      { role: 'user', content: message.trim() },
    ];

    // 2. Resolve AI Provider (defaults to Ollama)
    let provider = AIProviderFactory.getProvider();
    let reply = '';
    let usedProvider = provider.name;
    let usedModel = config.ollama.model || 'qwen2.5:3b';

    try {
      if (typeof provider.generateChat === 'function') {
        reply = await provider.generateChat({
          messages: formattedMessages,
          temperature: temperature !== null ? temperature : 0.7,
        });
      } else {
        reply = await provider.generateText({
          systemPrompt: this.systemPrompt,
          userPrompt: message.trim(),
          temperature: 0.7,
        });
      }
    } catch (primaryErr) {
      console.warn(`⚠️ [ChatService] Primary provider (${provider.name}) notice:`, primaryErr.message);

      // Graceful fallback to smart linguistic mock provider
      try {
        const fallbackProvider = AIProviderFactory.getProvider('mock');
        reply = await fallbackProvider.generateChat({ messages: formattedMessages });
        usedProvider = 'mock';
        usedModel = 'smart-linguistic-v2';
      } catch (fallbackErr) {
        reply = `I am here to help you write and edit! How would you like me to assist with your text today?`;
        usedProvider = 'fallback';
        usedModel = 'assistant-fallback';
      }
    }

    return {
      reply: reply.trim(),
      provider: usedProvider,
      model: usedModel,
      conversationId: convId,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health and model capability check for the chat assistant
   */
  async getStatus() {
    const provider = AIProviderFactory.getProvider();
    const health = await provider.healthCheck();
    return {
      service: 'Humanoider Chatbot',
      provider: provider.name,
      model: config.ollama.model || 'qwen2.5:3b',
      status: health.reachable || health.status === 'ready' ? 'online' : 'fallback',
      details: health,
    };
  }
}

export const chatService = new ChatService();
export default chatService;
