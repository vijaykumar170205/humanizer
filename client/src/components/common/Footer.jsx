import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/cutm-logo.png"
                alt="Centurion University of Technology and Management Logo"
                className="h-9 w-9 object-contain rounded-full"
              />
              <span className="text-xl font-extrabold text-white tracking-tight">Humanoider</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Transforming stiff, robotic drafts into natural, engaging, context-aware human writing while preserving original meaning and facts.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero data retention on temporary uploads</span>
            </div>
          </div>

          {/* Tools & Studio */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Writing Suite</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/rewriter" className="hover:text-white transition-colors">Humanizer Studio</Link></li>
              <li><Link to="/tools/detector" className="hover:text-white transition-colors">AI Content Detector</Link></li>
              <li><Link to="/tools/paraphraser" className="hover:text-white transition-colors">Smart Paraphraser</Link></li>
              <li><Link to="/tools/grammar" className="hover:text-white transition-colors">Grammar & Style Fixer</Link></li>
              <li><Link to="/tools/essay" className="hover:text-white transition-colors">Academic Essay Writer</Link></li>
            </ul>
          </div>

          {/* Platform & Account */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/pricing" className="hover:text-white transition-colors">Plans & Pricing</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">User Dashboard</Link></li>
              <li><Link to="/history" className="hover:text-white transition-colors">Rewrite History</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Privacy & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li className="flex items-center space-x-1.5 text-slate-500 pt-2">
                <Lock className="w-3 h-3 text-brand-400" />
                <span>256-Bit SSL Encrypted</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Humanoider — Centurion University of Technology and Management. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>for natural human communication</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
