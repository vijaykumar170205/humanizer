import React from 'react';

export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
        <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Humanly platform, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Permitted Use</h2>
          <p>
            Humanly provides AI-assisted editing and writing tools for drafting, rephrasing, and proofreading. Users are responsible for reviewing and verifying the accuracy and academic suitability of all generated outputs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Usage Limits & Fair Use</h2>
          <p>
            Monthly word quotas correspond to your chosen plan tier. Automated abuse, denial of service attacks, or attempts to bypass rate limiters will result in immediate suspension.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
