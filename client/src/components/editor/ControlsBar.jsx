import React from 'react';
import { useRewriter } from '../../context/RewriterContext';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Chinese',
  'Arabic',
];

export const ControlsBar = () => {
  const { language, setLanguage, isProcessing } = useRewriter();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs mb-6 transition-colors flex items-center justify-between gap-4">
      <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
          <Globe className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Target Language
          </span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {language}
          </span>
        </div>
      </div>

      <div className="w-48 sm:w-56">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isProcessing}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none font-medium cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang} className="dark:bg-slate-800 dark:text-slate-100">
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ControlsBar;
