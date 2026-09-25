import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  History,
} from 'lucide-react';

export const GrammarPage = () => {
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to check for grammar.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tools/grammar/check', { text });
      if (res.data.success) {
        setReport(res.data.data);
        toast.success(`Found ${res.data.data.issuesCount} suggestion(s).`);
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_grammar';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: text,
            rewrittenText: res.data.data.correctedText,
            badge: `Score: ${res.data.data.readabilityScore}/100`,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Grammar check failed.');
    } finally {
      setLoading(false);
    }
  };

  const applyAllFixes = () => {
    if (report?.correctedText) {
      setText(report.correctedText);
      toast.success('Applied all grammatical improvements!');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report?.correctedText || text);
    setCopied(true);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Grammar & Readability Checker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Inspect spelling, punctuation, passive voice, awkward phrasing, and vocabulary precision.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Grammar History</span>
        </button>
      </div>

      {/* Input area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Draft Text</span>
          <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        </div>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste sentences to inspect for grammar, punctuation, and readability slips..."
          className="w-full resize-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed outline-none font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />

        <div className="flex justify-end">
          <button
            onClick={handleCheck}
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Grammar...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Check Grammar & Readability</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results & Corrections */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Summary / Corrected Output */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Polished Text Output</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={applyAllFixes}
                  className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Apply All Fixes</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
              {report.correctedText}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic">{report.overallFeedback}</p>
          </div>

          {/* Issue Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Issues ({report.issuesCount})
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Score: {report.readabilityScore}/100
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {report.corrections && report.corrections.length > 0 ? (
                report.corrections.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded line-through">
                        {item.originalSnippet}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        {item.suggestedSnippet}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.explanation}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span>No grammatical or structural defects identified!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="grammar"
        toolTitle="Grammar Checker History"
        onRestore={(item) => {
          if (item.originalText) setText(item.originalText);
          if (item.rewrittenText) setReport({ correctedText: item.rewrittenText, issuesCount: 0, readabilityScore: 95, overallFeedback: 'Restored from past check', corrections: [] });
        }}
      />
    </div>
  );
};

export default GrammarPage;
