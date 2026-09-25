import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ToolHistoryDrawer } from '../components/common/ToolHistoryDrawer';
import { FileText, Copy, Check, Sparkles, Download, RefreshCw, History } from 'lucide-react';

export const ArticleRewriterPage = () => {
  const [article, setArticle] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const toast = useToast();
  const { refreshUserData } = useAuth();

  const handleRewrite = async () => {
    if (!article.trim()) {
      toast.error('Please enter article content.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/rewrite/article', { article });
      if (res.data.success) {
        const rewritten = res.data.data.rewrittenText;
        setOutput(rewritten);
        toast.success('Article rewritten successfully!');
        refreshUserData();

        // Save locally
        try {
          const localKey = 'humanly_tool_history_article';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText: article.slice(0, 300) + (article.length > 300 ? '...' : ''),
            rewrittenText: rewritten,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.message || 'Failed to rewrite article.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied article to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([output], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `humanly_article_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Long-Form Article Rewriter</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Rewrites long articles and blog posts while strictly preserving Markdown headings, bullet points, and section layouts.
          </p>
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <History className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Article History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[520px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Original Article (Markdown Supported)</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              {article.trim() ? article.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <textarea
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="# Introduction to Modern Systems&#10;&#10;Here is the first section..."
            className="flex-1 w-full resize-none text-sm outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 font-mono text-xs"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[520px]">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Rewritten Article</span>
            {output && (
              <div className="flex items-center space-x-2">
                <button onClick={handleCopy} className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer" title="Copy">
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={handleDownload} className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer" title="Download Markdown">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto text-xs font-mono text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400" />
                <span className="text-xs">Rewriting article while protecting headings...</span>
              </div>
            ) : output ? (
              output
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-sans">
                Rewritten long-form article will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleRewrite}
          disabled={loading || !article.trim()}
          className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? 'Rewriting Article...' : 'Rewrite Entire Article'}</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="article"
        toolTitle="Article Rewriter History"
        onRestore={(item) => {
          if (item.originalText) setArticle(item.originalText);
          if (item.rewrittenText) setOutput(item.rewrittenText);
        }}
      />
    </div>
  );
};

export default ArticleRewriterPage;
