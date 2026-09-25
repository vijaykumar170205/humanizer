import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  History,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  X,
  Search,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const ToolHistoryDrawer = ({
  isOpen,
  onClose,
  toolKey = 'humanizer',
  toolTitle = 'Writing History',
  onRestore = null,
}) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const localKey = `humanly_tool_history_${toolKey}`;

  // Load history from API or fallback to localStorage
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await api.get(`/history?tool=${toolKey}&limit=40`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setHistoryList(res.data.data);
          // Also mirror to localStorage
          try {
            localStorage.setItem(localKey, JSON.stringify(res.data.data));
          } catch (e) {}
        }
      } else {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setHistoryList(JSON.parse(stored));
        } else {
          setHistoryList([]);
        }
      }
    } catch (err) {
      // Local fallback
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setHistoryList(JSON.parse(stored));
        } else {
          setHistoryList([]);
        }
      } catch (e) {
        setHistoryList([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toolKey, localKey]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Delete specific history record
  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    try {
      if (isAuthenticated) {
        await api.delete(`/history/${id}`);
      }
    } catch (err) {
      // Continue and remove locally
    }

    // Update local state and localStorage
    const updated = historyList.filter((item) => (item._id || item.id) !== id);
    setHistoryList(updated);
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    toast.success('Removed history record.');
  };

  // Clear all history for this tool
  const handleClearAll = async () => {
    if (!window.confirm(`Are you sure you want to clear your ${toolTitle.toLowerCase()}?`)) return;

    try {
      if (isAuthenticated) {
        await api.delete('/history');
      }
    } catch (err) {}

    setHistoryList([]);
    try {
      localStorage.removeItem(localKey);
    } catch (e) {}

    toast.success(`Cleared ${toolTitle.toLowerCase()}.`);
  };

  // Copy output
  const handleCopy = (text, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter list by search query
  const filteredList = historyList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const orig = (item.originalText || '').toLowerCase();
    const rew = (item.rewrittenText || '').toLowerCase();
    return orig.includes(q) || rew.includes(q);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-slide-up border-l border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{toolTitle}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">View, restore, or delete past searches & transformations</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {historyList.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Clear all history for this tool"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter history records..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading past records...</div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item, idx) => {
              const itemId = item._id || item.id || `hist_${idx}`;
              const origText = item.originalText || '';
              const outText = item.rewrittenText || '';
              const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent';

              return (
                <div
                  key={itemId}
                  className="p-4 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                    {(item.language || item.badge) && (
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-[10px]">
                        {item.language || item.badge}
                      </span>
                    )}
                  </div>

                  {/* Input Snippet */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Input / Query
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {origText}
                    </p>
                  </div>

                  {/* Output Snippet */}
                  {outText && (
                    <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Result
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed">
                        {outText}
                      </p>
                    </div>
                  )}

                  {/* Action row: Restore, Copy, Delete specific history */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    {onRestore && (
                      <button
                        onClick={() => {
                          onRestore(item);
                          onClose();
                        }}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore into Tool</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1.5 ml-auto">
                      {outText && (
                        <button
                          onClick={(e) => handleCopy(outText, itemId, e)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Copy Result"
                        >
                          {copiedId === itemId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Delete specific history entry button */}
                      <button
                        onClick={(e) => handleDeleteItem(itemId, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete this history record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No history found</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Queries and generated outputs for {toolTitle.toLowerCase()} will appear here automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {isAuthenticated
            ? '✓ Securely synced with your Humanly cloud history'
            : 'ℹ️ Saved to your local browser storage'}
        </div>
      </div>
    </div>
  );
};

export default ToolHistoryDrawer;
