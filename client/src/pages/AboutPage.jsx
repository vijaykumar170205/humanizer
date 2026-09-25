import React from 'react';
import { Sparkles, Shield, Heart, Award, CheckCircle2 } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Our Mission</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About Humanly AI Writing Assistant
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          We believe in authentic human connection. Our mission is to transform mechanical, robotic drafts into natural, engaging, context-aware writing suitable for real people.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">Why We Built Humanly</h2>
        <p>
          As automated generation tools expanded, modern writing began suffering from monotonous sentence cadences, stiff formulaic transitions (like "Furthermore," "Moreover," "In today's fast-paced world"), and thesaurus stuffing.
        </p>
        <p>
          Humanly was engineered from the ground up to solve this. Instead of superficial synonym swapping, our multi-stage linguistic engine focuses on <strong>sentence length variation (burstiness)</strong>, <strong>active voice</strong>, <strong>colloquial rhythm</strong>, and <strong>ironclad preservation of factual meaning and terminology</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Zero Deceptive Claims</h3>
            <p className="text-xs text-slate-600">
              We focus on genuine communication quality rather than making unfounded promises to "bypass all detectors."
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Privacy by Design</h3>
            <p className="text-xs text-slate-600">
              Your uploaded files are processed in RAM memory buffers and never permanently archived without your instruction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
