import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Free Starter',
    id: 'free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual writers, individual students, and quick proofreading.',
    words: '10,000 words / month',
    features: [
      'Humanizer Writing Studio',
      'AI Content Detector (Basic)',
      'Smart Paraphraser (Standard mode)',
      'Grammar & Readability Checker',
      'PDF, DOCX & TXT file upload (up to 5MB)',
      '7-day rewrite history',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro Creator',
    id: 'pro',
    price: '$19',
    period: 'per month',
    description: 'For researchers, content creators, marketers, and power writers.',
    words: '100,000 words / month',
    features: [
      'Everything in Free',
      'Unlimited history retention',
      'Academic Essay & Paper Generator',
      'Long-form Article & Blog Rewriter',
      'All 6 Paraphrasing Modes',
      'Sentence & Paragraph Rewriters',
      '10MB file uploads (PDF & Word)',
      'Priority AI generation speed',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Business & Teams',
    id: 'business',
    price: '$49',
    period: 'per month',
    description: 'For academic departments, agencies, and high-volume publishing teams.',
    words: '500,000 words / month',
    features: [
      'Everything in Pro',
      '500,000 words monthly capacity',
      '20MB document upload limits',
      'Custom vocabulary & evasion profiles',
      'Team workspace sharing',
      'API Access keys',
      'Dedicated support & SLAs',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const PricingPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Flexible Plans for Every Writer
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Transform rough drafts into natural, engaging human communication with generous word allowances.
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`p-8 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'border-brand-500 ring-4 ring-brand-100 dark:ring-brand-950 shadow-xl scale-105 z-10'
                : 'border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/{plan.period}</span>
              </div>

              <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 rounded-xl border border-brand-100 dark:border-brand-900/60 text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>{plan.words}</span>
              </div>

              {/* Features list */}
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={user ? '/rewriter' : '/register'}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  plan.popular
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span>{user?.plan === plan.id ? 'Current Plan' : plan.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
