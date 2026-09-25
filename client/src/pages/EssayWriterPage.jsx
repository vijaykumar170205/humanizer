import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Download,
  ArrowRight,
  RefreshCw,
  Edit3,
  History,
} from 'lucide-react';

const ACADEMIC_LEVELS = [
  'High School',
  'Undergraduate / College',
  'Graduate / Masters',
  'Doctoral / PhD',
  'Professional / Industry',
];

const STRUCTURES = [
  'Standard 5-Paragraph Essay',
  'Argumentative & Persuasive Thesis',
  'Comparative & Contrast Analysis',
  'Expository & Informational Review',
  'Research Manuscript with Subheadings',
];

const CITATIONS = ['APA 7th Edition', 'MLA 9th Edition', 'Chicago 17th Edition', 'Harvard Style', 'None'];

export const EssayWriterPage = () => {
  const [topic, setTopic] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate / College');
  const [targetWordCount, setTargetWordCount] = useState(650);
  const [structure, setStructure] = useState('Standard 5-Paragraph Essay');
  const [citationStyle, setCitationStyle] = useState('APA 7th Edition');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [essayContent, setEssayContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter an essay topic or research prompt.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tools/essay/generate', {
        topic,
        academicLevel,
        targetWordCount,
        structure,
        citationStyle,
        additionalNotes,
      });

      if (res.data.success) {
        const generated = res.data.data.essayContent;
        setEssayContent(generated);
        toast.success('Essay generated successfully!');
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_essay';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: `Topic: ${topic} (${academicLevel})`,
            rewrittenText: generated,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Essay generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(essayContent);
    setCopied(true);
    toast.success('Copied essay to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([essayContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${topic.slice(0, 20).replace(/\s+/g, '_')}_essay.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <GraduationCap className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <span>Academic Essay & Paper Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Craft structured essays with clear thesis arguments, substantiated paragraphs, and citation formatting.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Essay History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Essay Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic or Thesis Prompt *
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of renewable energy transitions on developing economies..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Level</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="dark:bg-slate-800 dark:text-slate-100">
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Structure Format</label>
            <select
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              {STRUCTURES.map((s) => (
                <option key={s} value={s} className="dark:bg-slate-800 dark:text-slate-100">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Citations</label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {CITATIONS.map((c) => (
                  <option key={c} value={c} className="dark:bg-slate-800 dark:text-slate-100">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Words (~{targetWordCount})
              </label>
              <input
                type="range"
                min={300}
                max={1500}
                step={50}
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(Number(e.target.value))}
                className="w-full mt-2 accent-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Additional Directives (Optional)
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Include 3 distinct empirical counterarguments"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Writing Paper...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Complete Essay</span>
              </>
            )}
          </button>
        </div>

        {/* Editor / Output Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Manuscript Editor</span>
            </div>

            {essayContent && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {essayContent.trim().split(/\s+/).length} words
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Developing arguments and compiling thesis outline...</p>
              </div>
            ) : essayContent ? (
              <textarea
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                className="w-full h-full resize-none text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans outline-none bg-transparent"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center p-8 space-y-2">
                <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your generated essay will appear here</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                  Configure your thesis topic, academic level, and citation format to generate a complete draft.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="essay"
        toolTitle="Essay Generator History"
        onRestore={(item) => {
          if (item.originalText) {
            const match = item.originalText.match(/Topic:\s*(.*?)(?:\s*\(|$)/);
            if (match) setTopic(match[1]);
          }
          if (item.rewrittenText) setEssayContent(item.rewrittenText);
        }}
      />
    </div>
  );
};

export default EssayWriterPage;
