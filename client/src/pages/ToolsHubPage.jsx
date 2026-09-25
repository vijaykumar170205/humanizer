import React from 'react';
import { Link } from 'react-router-dom';
import {
  PenTool,
  ScanEye,
  Wand2,
  FileCheck,
  GraduationCap,
  AlignLeft,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const TOOLS = [
  {
    id: 'humanizer',
    title: 'Humanizer Studio',
    description: 'Transform rough or AI drafts into natural, engaging writing with full context and fact preservation.',
    path: '/rewriter',
    icon: PenTool,
    color: 'from-brand-500 to-indigo-600',
    badge: 'Popular',
  },
  {
    id: 'detector',
    title: 'AI Content Detector',
    description: 'Analyze sentence-level rhythm, burstiness, and vocabulary distributions to estimate AI likelihood.',
    path: '/tools/detector',
    icon: ScanEye,
    color: 'from-amber-500 to-orange-600',
    badge: 'Analytical',
  },
  {
    id: 'paraphraser',
    title: 'Smart Paraphraser',
    description: 'Rephrase text across 6 modes including Standard, Fluency, Academic, Creative, and Simple.',
    path: '/tools/paraphraser',
    icon: Wand2,
    color: 'from-indigo-500 to-purple-600',
    badge: 'Essential',
  },
  {
    id: 'grammar',
    title: 'Grammar & Style Fixer',
    description: 'Detect grammatical issues, spelling slips, awkward phrasing, and apply 1-click improvements.',
    path: '/tools/grammar',
    icon: FileCheck,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Pro Quality',
  },
  {
    id: 'essay',
    title: 'Academic Essay Writer',
    description: 'Generate structured essays with thesis statements, body arguments, and citation formatting.',
    path: '/tools/essay',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-600',
    badge: 'Academic',
  },
  {
    id: 'sentence',
    title: 'Sentence Rewriter',
    description: 'Generate multiple natural variations for individual sentences with distinct rhythmic cadence.',
    path: '/tools/sentence',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
    badge: 'Quick Edit',
  },
  {
    id: 'paragraph',
    title: 'Paragraph Rewriter',
    description: 'Optimize paragraph transitions, cohesive flow, and readability.',
    path: '/tools/paragraph',
    icon: AlignLeft,
    color: 'from-violet-500 to-indigo-700',
    badge: 'Cohesion',
  },
  {
    id: 'article',
    title: 'Article Rewriter',
    description: 'Rewrite complete long-form articles while preserving Markdown headings, tables, and structure.',
    path: '/tools/article',
    icon: FileText,
    color: 'from-slate-700 to-slate-900',
    badge: 'Long-Form',
  },
  {
    id: 'plagiarism',
    title: 'Plagiarism Scanner',
    description: 'Scan content against duplication indices with seamless API integration architecture.',
    path: '/tools/plagiarism',
    icon: Search,
    color: 'from-emerald-600 to-green-700',
    badge: 'Verification',
  },
];

export const ToolsHubPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Writing & Editing Utilities</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Explore specialized AI writing tools designed for every step of your creative, academic, and professional workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              to={tool.path}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-lg dark:hover:shadow-brand-950/40 transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{tool.description}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsHubPage;
