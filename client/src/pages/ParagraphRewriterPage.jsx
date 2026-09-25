import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import { AlignLeft, Copy, Check, Sparkles, RefreshCw, History } from 'lucide-react';

export const ParagraphRewriterPage = () => {
  const [paragraph, setParagraph] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleRewrite = async () => {
    if (!paragraph.trim()) {
      toast.error('Please enter a paragraph to rewrite.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/rewrite/paragraph', { paragraph });
      if (res.data.success) {
        const rewritten = res.data.data.rewrittenText;
        setOutput(rewritten);
        toast.success('Paragraph rewritten!');
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_paragraph';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: paragraph,
            rewrittenText: rewritten,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Failed to rewrite paragraph.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <AlignLeft className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            <span>Paragraph Rewriter</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Optimize paragraph flow, eliminate repetition, and improve transitions.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span>Paragraph History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Original Paragraph</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              {paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <textarea
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            placeholder="Paste complete paragraph here..."
            className="flex-1 w-full resize-none text-sm outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Polished Paragraph</span>
            {output && (
              <button onClick={handleCopy} className="p-1 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-violet-600 dark:text-violet-400" />
                <span className="text-xs">Optimizing paragraph flow...</span>
              </div>
            ) : output ? (
              output
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                Polished paragraph will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleRewrite}
          disabled={loading || !paragraph.trim()}
          className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? 'Refining...' : 'Rewrite Paragraph'}</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="paragraph"
        toolTitle="Paragraph Rewriter History"
        onRestore={(item) => {
          if (item.originalText) setParagraph(item.originalText);
          if (item.rewrittenText) setOutput(item.rewrittenText);
        }}
      />
    </div>
  );
};

export default ParagraphRewriterPage;
