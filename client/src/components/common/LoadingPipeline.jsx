import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export const LoadingPipeline = ({ step = 'Transforming text...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-inner">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-base font-semibold text-slate-800 animate-pulse">{step}</h4>
        <p className="text-xs text-slate-500">
          Refining sentence rhythm, vocabulary variation, and conversational cadence...
        </p>
      </div>

      {/* Progress visual bar */}
      <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 animate-pulse rounded-full w-3/4"></div>
      </div>
    </div>
  );
};

export default LoadingPipeline;
