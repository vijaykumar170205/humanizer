import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Users,
  Activity,
  Server,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  RefreshCw,
} from 'lucide-react';

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'health' | 'feedback'
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, usersRes, feedbackRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/system-health'),
        api.get(`/admin/users?search=${encodeURIComponent(search)}`),
        api.get('/admin/feedback'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (healthRes.data.success) setHealth(healthRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (feedbackRes.data.success) setFeedback(feedbackRes.data.data);
    } catch (err) {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search]);

  const handleUpdateUserPlan = async (id, newPlan) => {
    try {
      await api.patch(`/admin/users/${id}`, { plan: newPlan });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, plan: newPlan } : u)));
      toast.success('Updated user plan.');
    } catch (err) {
      toast.error('Failed to update plan.');
    }
  };

  const handleToggleUserActive = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/users/${id}`, { isActive: !currentStatus });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u)));
      toast.success('User status updated.');
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted.');
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Platform Management</h1>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh System Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Total Users</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.metrics.totalUsers}</div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{stats.metrics.activeUsers} Active</span>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Words Processed</span>
            <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
              {stats.metrics.platformWordsProcessed?.toLocaleString() || 0}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Across all user transformations</span>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Total Rewrites</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.metrics.totalRewrites}</div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{stats.metrics.totalDocuments} Saved Docs</span>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Server Status</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>Operational</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{stats.systemInfo?.memoryUsageMB}MB Heap</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Users Directory
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'health'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AI Engine & Database Health
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'feedback'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Feedback Telemetry ({feedback.length})
        </button>
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{users.length} accounts found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Name & Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Words Used</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <select
                        value={u.plan}
                        onChange={(e) => handleUpdateUserPlan(u._id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </td>
                    <td className="px-6 py-3.5">
                      {u.wordsUsed?.toLocaleString() || 0} / {u.wordLimit?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleToggleUserActive(u._id, u.isActive)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          u.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Health */}
      {activeTab === 'health' && health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Database Status</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">State:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{health.database.state}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Host:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.database.host}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">Health:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{health.database.status}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>AI Provider Status</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Active Provider:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 uppercase">{health.aiEngine.activeProvider}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Gemini Adapter:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.aiEngine.providers.gemini.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">OpenAI Adapter:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.aiEngine.providers.openai.status}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">Smart Linguistic Fallback:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Feedback */}
      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Rating Submissions</h3>
          <div className="space-y-3">
            {feedback.length > 0 ? (
              feedback.map((f) => (
                <div key={f._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Rating: {f.rating}/5 Stars</span>
                    <span className="text-slate-400 dark:text-slate-500">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  {f.comment && <p className="text-slate-700 dark:text-slate-300 italic">"{f.comment}"</p>}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Tool: {f.toolUsed}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">No user feedback submitted yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
