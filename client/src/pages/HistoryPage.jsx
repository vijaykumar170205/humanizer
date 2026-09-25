import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRewriter } from '../../src/context/RewriterContext';
import { useToast } from '../../src/context/ToastContext';
import api from '../services/api';
import {
  History,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toolFilter, setToolFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { setOriginalText, setRewrittenText } = useRewriter();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/history?tool=${toolFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load rewrite history.');
    } finally {
      setLoading(false);
    }
  }, [search, toolFilter, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      toast.success('History record removed.');
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err) {
      toast.error('Failed to delete history record.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history records?')) return;

    try {
      await api.delete('/history');
      setHistory([]);
      setSelectedItem(null);
      toast.success('All history records cleared.');
    } catch (err) {
      toast.error('Failed to clear history.');
    }
  };

  const handleRestore = (item) => {
    setOriginalText(item.originalText);
    setRewrittenText(item.rewrittenText);
    toast.success('Restored draft into Writing Studio!');
    navigate('/rewriter');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Rewrite History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Browse and restore all past text transformations and drafts.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords in history..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Tools</option>
            <option value="humanizer">Humanizer</option>
            <option value="paraphraser">Paraphraser</option>
            <option value="essay">Essay Writer</option>
            <option value="paragraph">Paragraph</option>
            <option value="article">Article</option>
          </select>
        </div>
      </div>

      {/* Main Content: List + Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 h-[600px] overflow-y-auto space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  selectedItem?._id === item._id
                    ? 'bg-brand-50/70 dark:bg-brand-950/60 border-brand-300 dark:border-brand-600 ring-2 ring-brand-100 dark:ring-brand-900'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {item.toolUsed}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                  {item.originalText}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>{item.wordCountOriginal || 0} words</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{item.language || 'English'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No rewrite history records found</p>
            </div>
          )}
        </div>

        {/* Detail Inspection Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 h-[600px] flex flex-col justify-between">
          {selectedItem ? (
            <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                      {selectedItem.toolUsed}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(selectedItem.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(selectedItem.rewrittenText, selectedItem._id)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Copy Output"
                  >
                    {copiedId === selectedItem._id ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRestore(selectedItem)}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore into Studio</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Side-by-side snippet preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 flex flex-col">
                  <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Original Input</span>
                  <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                    {selectedItem.originalText}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-brand-200/80 dark:border-brand-800 space-y-2 flex flex-col">
                  <span className="text-[11px] font-bold uppercase text-brand-700 dark:text-brand-300">Rewritten Output</span>
                  <div className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                    {selectedItem.rewrittenText}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select a record from the left to view</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                You can inspect side-by-side text, copy output, or restore drafts directly into the editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
