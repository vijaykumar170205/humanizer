import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import { Search, ShieldAlert, Info, Key, CheckCircle2, RefreshCw, History } from 'lucide-react';

export const PlagiarismPage = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();

  const handleScan = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to scan.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tools/plagiarism/check', { text });
      if (res.data.success) {
        setScanResult(res.data.data);

        // Save locally
        try {
          const localKey = 'humanly_tool_history_plagiarism';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: text,
            rewrittenText: res.data.data.message || `Similarity: ${res.data.data.similarityPercentage || 0}%`,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Plagiarism scan request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <Search className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Plagiarism Analysis Scanner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Verify original authorship and check for duplication across indexed academic and web sources.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Plagiarism History</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Input Content</span>
          <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        </div>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste draft or manuscript to scan for duplication..."
          className="w-full resize-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed outline-none font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Index...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scan for Plagiarism</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="space-y-4 animate-fade-in">
          {!scanResult.configured ? (
            <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>{scanResult.message}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{scanResult.guidance}</p>
              <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400 border-t border-slate-800">
                <Key className="w-4 h-4 text-brand-400" />
                <span>Transparent architecture: No fabricated percentages are shown.</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <h3 className="text-base font-bold">Plagiarism Scan Passed</h3>
              <p className="text-xs mt-1">Similarity score: {scanResult.similarityPercentage}%</p>
            </div>
          )}
        </div>
      )}

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="plagiarism"
        toolTitle="Plagiarism Scanner History"
        onRestore={(item) => {
          if (item.originalText) setText(item.originalText);
        }}
      />
    </div>
  );
};

export default PlagiarismPage;
