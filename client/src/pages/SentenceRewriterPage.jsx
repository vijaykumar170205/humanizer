import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import { Sparkles, Copy, Check, RefreshCw, History } from 'lucide-react';

export const SentenceRewriterPage = () => {
  const [sentence, setSentence] = useState('');
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleRewrite = async () => {
    if (!sentence.trim()) {
      toast.error('Please enter a sentence to rewrite.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/rewrite/sentence', { sentence });
      if (res.data.success) {
        const vars = res.data.data.variations || [];
        setVariations(vars);
        toast.success('Generated sentence variations!');
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_sentence';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: sentence,
            rewrittenText: vars[0]?.text || '',
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Failed to rewrite sentence.');
    } finally {
      setLoading(false);
    }
  };

  const copyVariation = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied variation to clipboard!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <Sparkles className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            <span>AI Sentence Rewriter</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Transform single sentences into multiple crisp, natural alternatives.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          <span>Sentence History</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
        <input
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="e.g. It is imperative that we utilize all available data to optimize our conclusions."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
        />

        <div className="flex justify-end">
          <button
            onClick={handleRewrite}
            disabled={loading || !sentence.trim()}
            className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Options...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Rewrite Sentence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {variations.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alternative Phrasings</h3>
          {variations.map((v, idx) => (
            <div
              key={idx}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between space-x-4 hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded">
                  {`Option ${idx + 1}`}
                </span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{v.text}</p>
              </div>
              <button
                onClick={() => copyVariation(v.text, idx)}
                className="p-2 text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title="Copy"
              >
                {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="sentence"
        toolTitle="Sentence Rewriter History"
        onRestore={(item) => {
          if (item.originalText) setSentence(item.originalText);
          if (item.rewrittenText) setVariations([{ text: item.rewrittenText, toneLabel: 'Saved' }]);
        }}
      />
    </div>
  );
};

export default SentenceRewriterPage;
