import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

const QUICK_PROMPTS = [
  '✨ How can I make my text sound more human?',
  '📝 Help me paraphrase a sentence naturally',
  '💡 Suggest strong academic vocabulary',
  '🔍 What are the best editing tips for clarity?',
];

export const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('humanly_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "👋 Hi there! I'm your **Humanoider AI Assistant**, running locally with **Qwen 2.5 3B**.\n\nAsk me anything about writing, editing, grammar, tone calibration, or brainstorming!",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('humanly_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll to bottom on new message or open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for API (last 10 messages excluding welcome and errors)
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.post('/chat', {
        message: messageText,
        history: historyPayload,
      });

      const replyContent =
        res.data?.reply ||
        res.data?.data?.reply ||
        res.data?.message ||
        "I've processed your request.";

      const assistantMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        provider: res.data?.provider || 'ollama',
        model: res.data?.model || 'qwen2.5:3b',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice**: ${err.message || 'Unable to communicate with local Ollama model.'}\n\nPlease verify that Ollama is running with \`qwen2.5:3b\`.`,
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    const initialWelcome = [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "✨ Chat cleared. How can I help you improve your writing today?",
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(initialWelcome);
    try {
      localStorage.setItem('humanly_chat_history', JSON.stringify(initialWelcome));
    } catch (e) {}
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center">
        {/* Tooltip on hover */}
        {isHovered && !isOpen && (
          <div className="mr-3 px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 text-xs font-medium rounded-lg shadow-lg border border-slate-700/50 whitespace-nowrap animate-fade-in pointer-events-none hidden sm:block">
            <span>Ask Humanoider AI (Qwen 2.5 3B)</span>
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-t border-slate-700/50" />
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Toggle Humanoider AI Assistant Chat"
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/30 flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              {/* Online indicator ping */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Widget Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[calc(100vh-7.5rem)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden animate-slide-up transition-all"
          style={{ zIndex: 60 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white border-b border-brand-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-tight text-white">
                    Humanoider AI
                  </h3>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[11px] text-brand-100/90 leading-none mt-0.5">
                  Local Qwen 2.5 3B • Fast & Private
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                aria-label="Clear chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Close chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  } group`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-sm'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 rounded-tl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    {/* Assistant message metadata / copy button */}
                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Sparkles className="w-3 h-3 text-brand-500" />
                          {msg.model || 'qwen2.5:3b'}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Thinking with Qwen...
                  </span>
                </div>
              </div>
            )}

            {/* Quick Prompt Chips (when few messages) */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-brand-300 dark:hover:border-brand-700 text-slate-700 dark:text-slate-300 transition-all duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Humanoider or paste text..."
                rows={1}
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none max-h-24 min-h-[38px]"
                style={{ height: 'auto' }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all duration-200 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-1 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              <span>Shift + Enter for new line</span>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Qwen 2.5 3B (Local)
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatBot;
