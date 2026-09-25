import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, RefreshCw, X, Check } from 'lucide-react';

export const GoogleLoginButton = ({ text = 'Continue with Google', className = '' }) => {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // If real Google Client ID is configured, load GIS script
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google Identity initialization error:', err);
      }
    }
  }, [clientId]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      await loginWithGoogle({ credential: response.credential });
      toast.success('Successfully signed in with Google!');
      navigate('/rewriter');
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (clientId && window.google?.accounts?.id) {
      // Trigger native Google GIS prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowPromptModal(true);
        }
      });
    } else {
      // Open instant Google Sign-In Selector
      setShowPromptModal(true);
    }
  };

  const handleSelectAccount = async (account) => {
    setLoading(true);
    try {
      await loginWithGoogle({
        profile: {
          email: account.email,
          name: account.name,
          id: `google_${Date.now()}`,
          avatar: account.avatar || '',
        },
      });
      setShowPromptModal(false);
      toast.success(`Welcome, ${account.name}! Signed in via Google.`);
      navigate('/rewriter');
    } catch (err) {
      toast.error(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      toast.error('Please provide a Gmail address.');
      return;
    }
    const cleanEmail = customEmail.includes('@') ? customEmail : `${customEmail.trim()}@gmail.com`;
    const cleanName = customName.trim() || cleanEmail.split('@')[0];

    handleSelectAccount({
      email: cleanEmail,
      name: cleanName,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all shadow-xs flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-60 ${className}`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            {/* Authentic Google Multi-color Vector Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>{text}</span>
          </>
        )}
      </button>

      {/* Google Authentication Dialog */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowPromptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1.5 pt-1">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign In with Google</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose a Google Account to continue to Humanoider</p>
            </div>

            {/* Quick Demo Google Accounts */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Quick Select
              </span>

              <button
                type="button"
                onClick={() =>
                  handleSelectAccount({
                    name: 'Alex Morgan',
                    email: 'alex.morgan.student@gmail.com',
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      Alex Morgan
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">alex.morgan.student@gmail.com</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectAccount({
                    name: 'Sarah Chen',
                    email: 'sarah.chen.writer@gmail.com',
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      Sarah Chen
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">sarah.chen.writer@gmail.com</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Enter Custom Gmail */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-2">
                Or Use Another Gmail
              </span>
              <form onSubmit={handleCustomSubmit} className="space-y-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Your Name (e.g. David)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Continue with this Gmail
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleLoginButton;
