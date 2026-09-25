import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import { Wand2, Copy, Check, ArrowRight, RefreshCw, History } from 'lucide-react';

const MODES = [
  { id: 'Standard', label: 'Standard', desc: 'Balanced rephrasing' },
  { id: 'Fluency', label: 'Fluency', desc: 'Smooth native flow' },
  { id: 'Professional', label: 'Professional', desc: 'Polished workplace phrasing' },
  { id: 'Academic', label: 'Academic', desc: 'Scholarly terminology' },
  { id: 'Creative', label: 'Creative', desc: 'Vivid & expressive' },
  { id: 'Simple', label: 'Simple', desc: 'Clear & accessible' },
];

export const ParaphraserPage = () => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('Standard');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleParaphrase = async () => {
    if (!text.trim()) {
      toast.error('Please provide text to paraphrase.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/rewrite/paraphrase', { text, mode });
      if (res.data.success) {
        const paraphrased = res.data.data.paraphrasedText;
        setOutput(paraphrased);
        toast.success(`Paraphrased using ${mode} mode.`);
        refreshUserData();

        // Cache locally
        try {
          const localKey = 'humanly_tool_history_paraphraser';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: text,
            rewrittenText: paraphrased,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Paraphrasing failed.');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Smart Paraphraser</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Rephrase your sentences with different complexity and vocabulary levels while maintaining exact meaning.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Paraphrase History</span>
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 justify-center bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === m.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Two Panel Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Input Text</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              {text.trim() ? text.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste sentences you want to rephrase..."
            className="flex-1 w-full resize-none text-sm outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Output */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center space-x-2">
              <span>Paraphrased Result</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {mode}
              </span>
            </div>
            {output && (
              <button
                onClick={handleCopy}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium">Rephrasing in {mode} mode...</span>
              </div>
            ) : output ? (
              output
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                Paraphrased output will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleParaphrase}
          disabled={loading || !text.trim()}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? 'Rephrasing...' : 'Paraphrase Text'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="paraphraser"
        toolTitle="Paraphraser History"
        onRestore={(item) => {
          if (item.originalText) setText(item.originalText);
          if (item.rewrittenText) setOutput(item.rewrittenText);
        }}
      />
    </div>
  );
};

export default ParaphraserPage;
