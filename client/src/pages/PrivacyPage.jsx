import React from 'react';
import { Shield } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            We collect information you provide directly, such as your account name and email when registering, and your temporary text input when using writing tools.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Document & File Handling</h2>
          <p>
            When you upload PDF, DOCX, TXT, or Markdown documents, files are parsed in memory buffers during the session and are not permanently saved on server disks unless you explicitly save the draft to your account library.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. AI Processing & Data Privacy</h2>
          <p>
            Your prompts and text snippets are processed strictly to generate your requested rewrite. We do not use your private personal drafts to train general public models.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Security</h2>
          <p>
            All network communication is secured with industry-standard TLS encryption. Authentication uses salted bcrypt password hashes and secure signed JWT tokens.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
