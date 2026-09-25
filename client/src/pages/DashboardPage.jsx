import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRewriter } from '../context/RewriterContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Gauge,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  Trash2,
  Edit2,
  Plus,
  Zap,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { setOriginalText } = useRewriter();
  const toast = useToast();
  const navigate = useNavigate();

  const [usageData, setUsageData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usageRes, docsRes] = await Promise.all([
          api.get('/user/usage'),
          api.get('/files/documents?limit=5'),
        ]);

        if (usageRes.data.success) {
          setUsageData(usageRes.data.data);
        }
        if (docsRes.data.success) {
          setDocuments(docsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDeleteDoc = async (id) => {
    try {
      await api.delete(`/files/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      toast.success('Document removed.');
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const handleOpenDoc = (doc) => {
    setOriginalText(doc.currentText || doc.originalText);
    navigate('/rewriter');
  };

  const wordsUsed = user?.wordsUsed || 0;
  const wordLimit = user?.wordLimit || 10000;
  const percentUsed = Math.min(100, Math.round((wordsUsed / (wordLimit || 1)) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Writer'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            You are on the <span className="font-bold text-white uppercase">{user?.plan} Plan</span>. Ready to refine your next draft?
          </p>
        </div>

        <Link
          to="/rewriter"
          className="px-6 py-3 bg-white text-brand-900 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all flex items-center space-x-2 shrink-0 shadow-md cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Open Writing Studio</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Usage Progress */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Monthly Word Quota</span>
            <Gauge className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{wordsUsed.toLocaleString()}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ {wordLimit.toLocaleString()} words</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                percentUsed > 90 ? 'bg-rose-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-brand-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{percentUsed}% used</span>
            <span>{Math.max(0, wordLimit - wordsUsed).toLocaleString()} left</span>
          </div>
        </div>

        {/* Total Rewrites */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Total Requests</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {usageData?.currentMonth?.requestsCount || 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI transformations processed this billing cycle</p>
        </div>

        {/* Files Processed */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Documents Processed</span>
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {usageData?.currentMonth?.filesProcessed || 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, and TXT files parsed</p>
        </div>

        {/* Plan Status */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Current Plan</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white capitalize mt-1">
              {user?.plan} Tier
            </div>
          </div>
          <Link
            to="/pricing"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 cursor-pointer"
          >
            <span>Upgrade Capacity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Documents</h3>
          </div>
          <Link
            to="/rewriter"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Draft</span>
          </Link>
        </div>

        {documents.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Words</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.title}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">{doc.wordCount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDoc(doc)}
                        className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 font-bold cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No saved documents yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              When you paste or upload files in the Studio, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
