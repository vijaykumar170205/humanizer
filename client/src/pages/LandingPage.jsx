import React from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceEditor } from '../components/editor/WorkspaceEditor';
import {
  Sparkles,
  CheckCircle2,
  FileCheck,
  Shield,
  Zap,
  BookOpen,
  Layers,
  ScanEye,
  PenTool,
  Wand2,
  ArrowRight,
  Award,
  Users,
  Check,
  HelpCircle,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        {/* Glow effect background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-300/30 dark:from-brand-900/30 via-indigo-300/20 dark:via-indigo-900/20 to-emerald-200/20 dark:to-emerald-950/20 blur-3xl -z-10 rounded-full pointer-events-none"></div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Make Your Writing Sound{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 dark:from-brand-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
            More Natural
          </span>
        </h1>

        {/* Hero Subheading */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Transform rough, robotic, or AI-assisted drafts into clear, engaging writing while preserving your
          exact original meaning, technical terminology, and contextual facts.
        </p>

        {/* Quick action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/rewriter"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Start Writing Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/tools"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Explore All 8 Tools</span>
          </Link>
        </div>

        {/* Trust bullets */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>10,000 Free Words / Month</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>PDF, DOCX & Markdown Extraction</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No Credit Card Required</span>
          </span>
        </div>
      </section>

      {/* ================= INTERACTIVE WORKSPACE DEMO ================= */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span>Humanizer Writing Studio</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Paste your text or upload a document below to experience authentic human cadence.
            </p>
          </div>
          <WorkspaceEditor />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-white dark:bg-slate-900/60 py-16 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">How Humanoider Works</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Our linguistic refinement pipeline intelligently elevates drafts across three seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3 relative group hover:border-brand-300 dark:hover:border-brand-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Input or Upload Document</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Paste any rough, synthetic draft or drag and drop a PDF, Word (DOCX), TXT, or Markdown document directly into the studio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3 relative group hover:border-brand-300 dark:hover:border-brand-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Anti-Detection Restructuring</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically purge 120+ synthetic AI markers, enforce natural contractions, and inject radical burstiness that bypasses Turnitin, GPTZero, and CopyLeaks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3 relative group hover:border-brand-300 dark:hover:border-brand-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate & Compare Diff</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive natural, rhythmic prose instantly. Inspect side-by-side word changes with our interactive visual diff viewer and export with 1-click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPLETE SUITE OF WRITING TOOLS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            A Complete Suite of Writing Utilities
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Engineered for students, researchers, authors, marketers, and professional communicators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/rewriter"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all group space-y-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Humanizer Studio
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Eliminate robotic sentence patterns, formulaic transitions, and thesaurus abuse.
            </p>
          </Link>

          <Link
            to="/tools/detector"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all group space-y-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanEye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              AI Content Detector
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Estimate burstiness, perplexity, and sentence-level syntactical indicators.
            </p>
          </Link>

          <Link
            to="/tools/paraphraser"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all group space-y-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Smart Paraphraser
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rephrase across 6 specialized modes including Fluency, Academic, and Simple.
            </p>
          </Link>

          <Link
            to="/tools/grammar"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all group space-y-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Grammar & Style Fixer
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspect punctuation, spelling, awkward clauses, and 1-click apply corrections.
            </p>
          </Link>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Everything you need to know about Humanoider.</p>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>How does Humanoider preserve original meaning and facts?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike primitive synonym spinners, Humanoider uses multi-stage linguistic context awareness. It retains all proper nouns, numerical figures, citations, URLs, and key terms while restructuring sentence cadences, active voice, and transition variety.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>What document formats can I upload?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You can upload PDF, Microsoft Word (.docx), Plain Text (.txt), and Markdown (.md) documents up to 10MB in size. Text is extracted in RAM and cleaned immediately.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Does Humanoider guarantee bypassing 100% of AI detectors?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We focus on genuine, high-quality human communication and natural sentence rhythm. Because AI detection tools rely on constantly shifting statistical heuristics, we make no deceptive claims of guaranteed detection scores.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Start Writing Naturally Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Join thousands of creators, researchers, and professionals crafting clear, engaging communication.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-brand-900 font-extrabold text-sm transition-all hover:scale-105 shadow-md cursor-pointer"
            >
              Get Started with 10,000 Free Words
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
