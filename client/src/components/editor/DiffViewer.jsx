import React from 'react';
import { Sparkles, Check, ArrowRight, Activity } from 'lucide-react';

export const DiffViewer = ({ diffResult }) => {
  if (!diffResult || !diffResult.diffChunks) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
        No comparison data available yet. Run a rewrite to inspect word changes.
      </div>
    );
  }

  const { diffChunks, stats } = diffResult;

  return (
    <div className="space-y-4">
      {/* Diff Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs transition-colors">
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Similarity</span>
          <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{stats.similarityPercentage}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Changed</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.changePercentage}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Words Added</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{stats.addedWords}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Words Removed</span>
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{stats.removedWords}</span>
        </div>
      </div>

      {/* Visual Text Diff */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-h-[350px] overflow-y-auto leading-relaxed text-sm text-slate-800 dark:text-slate-100 space-y-2 select-text font-sans transition-colors">
        <p>
          {diffChunks.map((chunk, index) => {
            if (chunk.added) {
              return (
                <span
                  key={index}
                  className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 font-medium px-1 py-0.5 rounded mx-0.5"
                  title="Added word"
                >
                  {chunk.value}
                </span>
              );
            }
            if (chunk.removed) {
              return (
                <span
                  key={index}
                  className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 line-through opacity-70 px-1 py-0.5 rounded mx-0.5"
                  title="Removed word"
                >
                  {chunk.value}
                </span>
              );
            }
            return <span key={index}>{chunk.value}</span>;
          })}
        </p>
      </div>

      <div className="flex items-center space-x-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-300 dark:bg-emerald-600"></span>
          <span>Added / Polished</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-300 dark:bg-rose-600"></span>
          <span>Removed Clichés</span>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
