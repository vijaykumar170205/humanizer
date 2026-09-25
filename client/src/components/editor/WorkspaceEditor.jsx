import React, { useState, useRef } from 'react';
import { useRewriter } from '../../context/RewriterContext';
import { useToast } from '../../context/ToastContext';
import { ControlsBar } from './ControlsBar';
import { DiffViewer } from './DiffViewer';
import { FeedbackModal } from './FeedbackModal';
import { LoadingPipeline } from '../common/LoadingPipeline';
import { ToolHistoryDrawer } from '../common/ToolHistoryDrawer';
import {
  Upload,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  ArrowRight,
  GitCompare,
  RotateCw,
  MessageSquare,
  FileText,
  FileCode,
  FileType,
  Share2,
  History,
} from 'lucide-react';

export const WorkspaceEditor = () => {
  const {
    originalText,
    setOriginalText,
    rewrittenText,
    setRewrittenText,
    diffResult,
    showDiff,
    setShowDiff,
    isProcessing,
    processingStep,
    uploadedFileName,
    isUploading,
    clearAll,
    handleFileUpload,
    executeRewrite,
  } = useRewriter();

  const toast = useToast();
  const fileInputRef = useRef(null);
  const [activeMobileTab, setActiveMobileTab] = useState('input'); // 'input' | 'output'
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Character & word counts
  const getWordCount = (str = '') => (str.trim() ? str.trim().split(/\s+/).length : 0);
  const getCharCount = (str = '') => str.length;

  const originalWords = getWordCount(originalText);
  const originalChars = getCharCount(originalText);
  const rewrittenWords = getWordCount(rewrittenText);
  const rewrittenChars = getCharCount(rewrittenText);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!rewrittenText) return;
    try {
      await navigator.clipboard.writeText(rewrittenText);
      setIsCopied(true);
      toast.success('Copied rewritten text to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Download rewritten file
  const handleDownload = (format = 'txt') => {
    if (!rewrittenText) return;

    const element = document.createElement('a');
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'md') {
      mimeType = 'text/markdown';
      extension = 'md';
    }

    const file = new Blob([rewrittenText], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = `humanly_rewrite_${Date.now()}.${extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Downloaded rewritten text as .${extension}`);
  };

  // Drag & drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Linguistic Controls Configuration Bar */}
      <ControlsBar />

      {/* Mobile Tab Selector */}
      <div className="flex md:hidden mb-4 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveMobileTab('input')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeMobileTab === 'input'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Original ({originalWords} words)
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('output')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeMobileTab === 'output'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Rewritten Output ({rewrittenWords} words)
        </button>
      </div>

      {/* Main Two-Panel Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* ================= LEFT PANEL: ORIGINAL TEXT ================= */}
        <div
          className={`bg-white dark:bg-slate-900 border ${
            isDragging ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200/90 dark:border-slate-800'
          } rounded-2xl shadow-xs flex flex-col h-[560px] transition-all overflow-hidden ${
            activeMobileTab === 'input' ? 'block' : 'hidden md:flex'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Original Text
              </span>
              {uploadedFileName && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[11px] font-semibold">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{uploadedFileName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* History Button */}
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(true)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                title="View past rewrite history"
              >
                <History className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>History</span>
              </button>

              {/* File upload hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                title="Upload PDF, DOCX, TXT, or MD"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Extracting...' : 'Upload File'}</span>
              </button>

              {originalText && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Clear text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Panel Textarea Workspace */}
          <div className="flex-1 p-4 relative flex flex-col">
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste your rough draft, AI-generated text, or drag and drop a PDF/DOCX document here to make it natural and human-like..."
              disabled={isProcessing}
              className="w-full h-full resize-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed outline-none font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent"
            />

            {/* Drag and drop overlay hint when empty */}
            {!originalText && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-xs p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 cursor-pointer transition-all bg-white/80 dark:bg-slate-800/80 hover:bg-brand-50/40 dark:hover:bg-slate-700/50 shadow-xs"
              >
                <Upload className="w-6 h-6 mb-1.5 text-slate-400 dark:text-slate-400 group-hover:text-brand-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Drag & drop your document here</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Supports PDF, Word (.docx), TXT, MD</p>
              </div>
            )}
          </div>

          {/* Panel Footer Counters */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center space-x-3">
              <span>{originalWords.toLocaleString()} words</span>
              <span>•</span>
              <span>{originalChars.toLocaleString()} characters</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Preserves facts & terminology</span>
          </div>
        </div>

        {/* ================= RIGHT PANEL: REWRITTEN OUTPUT ================= */}
        <div
          className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-[560px] overflow-hidden ${
            activeMobileTab === 'output' ? 'block' : 'hidden md:flex'
          }`}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Rewritten Output
              </span>
              {rewrittenText && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  Humanized
                </span>
              )}
            </div>

            {/* Action buttons */}
            {rewrittenText && !isProcessing && (
              <div className="flex items-center space-x-1.5">
                {/* Diff Viewer Toggle */}
                {diffResult && (
                  <button
                    type="button"
                    onClick={() => setShowDiff(!showDiff)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                      showDiff
                        ? 'bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Toggle Word Diff Comparison"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Diff</span>
                  </button>
                )}

                {/* Regenerate */}
                <button
                  type="button"
                  onClick={executeRewrite}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Regenerate with same settings"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Download Menu */}
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Feedback */}
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Rate rewrite"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 p-4 overflow-y-auto relative">
            {isProcessing ? (
              <LoadingPipeline step={processingStep} />
            ) : showDiff && diffResult ? (
              <DiffViewer diffResult={diffResult} />
            ) : rewrittenText ? (
              <div className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap select-text font-sans">
                {rewrittenText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your natural rewrite will appear here</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    Paste or upload your text above, then click Humanize.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Footer Counters */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center space-x-3">
              <span>{rewrittenWords.toLocaleString()} words</span>
              <span>•</span>
              <span>{rewrittenChars.toLocaleString()} characters</span>
            </div>
            {rewrittenWords > 0 && originalWords > 0 && (
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                {Math.round((rewrittenWords / originalWords) * 100)}% of original length
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Center Rewrite Button */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={executeRewrite}
          disabled={isProcessing || !originalText.trim()}
          className="group relative inline-flex items-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-brand-200 group-hover:rotate-12 transition-transform" />
          <span>{isProcessing ? 'Humanizing Draft...' : 'Humanize & Rewrite'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Feedback Modal Dialog */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        originalText={originalText}
        rewrittenText={rewrittenText}
        toolUsed="humanizer"
      />

      {/* Tool Specific History Drawer */}
      <ToolHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        toolKey="humanizer"
        toolTitle="Humanizer Studio History"
        onRestore={(item) => {
          if (item.originalText) setOriginalText(item.originalText);
          if (item.rewrittenText) setRewrittenText(item.rewrittenText);
        }}
      />
    </div>
  );
};

export default WorkspaceEditor;
