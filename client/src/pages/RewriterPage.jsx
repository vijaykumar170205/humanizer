import React from 'react';
import { WorkspaceEditor } from '../components/editor/WorkspaceEditor';
import { Sparkles } from 'lucide-react';

export const RewriterPage = () => {
  return (
    <div className="py-6 space-y-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span>Humanizer Writing Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Refine sentence rhythm, vocabulary variation, and natural voice while preserving meaning.
            </p>
          </div>
        </div>
      </div>
      <WorkspaceEditor />
    </div>
  );
};

export default RewriterPage;
