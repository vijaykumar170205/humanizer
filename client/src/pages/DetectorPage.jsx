import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import {
  ScanEye,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  RefreshCw,
  History,
} from 'lucide-react';

export const DetectorPage = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to evaluate for AI writing characteristics.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tools/detector/analyze', { text });
      if (res.data.success) {
        setReport(res.data.data);
        toast.success('Analysis complete!');
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_detector';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: text,
            rewrittenText: `AI Score: ${res.data.data.aiLikelihood}% | Human Score: ${res.data.data.humanLikelihood}% - Verdict: ${res.data.data.verdict}`,
            badge: `${res.data.data.humanLikelihood}% Human`,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Detection analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <ScanEye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Linguistic Probability Estimator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">AI Content Detector</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Evaluates statistical burstiness, perplexity variance, and structural rhythm to provide an estimated AI vs Human likelihood.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Detector History</span>
        </button>
      </div>

      {/* Main Input Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to analyze for synthetic patterns..."
          className="w-full resize-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed outline-none font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {text.trim() ? text.trim().split(/\s+/).length : 0} words
          </span>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Prose...</span>
              </>
            ) : (
              <>
                <ScanEye className="w-4 h-4" />
                <span>Scan for AI Patterns</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {report && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Score Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Probability Gauge Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Estimated Probability
                </span>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span
                    className={`text-4xl font-extrabold ${
                      report.humanLikelihood >= 65
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : report.humanLikelihood >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {report.humanLikelihood}%
                  </span>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Human Likelihood</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ({report.aiLikelihood}% AI Probability)
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-rose-100 dark:bg-rose-950/60 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${report.humanLikelihood}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-700 dark:text-emerald-400">Human</span>
                  <span className="text-rose-700 dark:text-rose-400">Synthetic</span>
                </div>
              </div>
            </div>

            {/* Verdict Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Model Verdict
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{report.verdict}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{report.summary}</p>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5" />
                <span>Confidence score: {report.confidenceScore}%</span>
              </div>
            </div>

            {/* Writing Traits Metrics */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Linguistic Metrics
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Sentence Burstiness:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.metrics.burstiness}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Perplexity Variance:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.metrics.perplexityEstimate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Vocabulary Diversity:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.metrics.vocabularyDiversity}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Pattern Repetition:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.metrics.repetitiveness}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sentence by Sentence Breakdown */}
          {report.sentenceAnalysis && report.sentenceAnalysis.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sentence-Level Analysis</h3>
              <div className="space-y-2.5">
                {report.sentenceAnalysis.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                      item.flagged
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{item.sentence}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          item.flagged
                            ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                            : 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {item.flagged ? 'Potential AI Cliché' : 'Natural Rhythm'}
                      </span>
                    </div>
                    {item.reason && <p className="text-[11px] opacity-75">{item.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ethical Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Important Notice on AI Detection</p>
              <p className="mt-0.5 leading-relaxed opacity-90">{report.disclaimer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="detector"
        toolTitle="AI Detector History"
        onRestore={(item) => {
          if (item.originalText) setText(item.originalText);
        }}
      />
    </div>
  );
};

export default DetectorPage;
