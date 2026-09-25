import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Common Layout Elements
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import FloatingChatBot from './components/common/FloatingChatBot';

// Pages
import LandingPage from './pages/LandingPage';
import RewriterPage from './pages/RewriterPage';
import ToolsHubPage from './pages/ToolsHubPage';
import DetectorPage from './pages/DetectorPage';
import ParaphraserPage from './pages/ParaphraserPage';
import GrammarPage from './pages/GrammarPage';
import PlagiarismPage from './pages/PlagiarismPage';
import EssayWriterPage from './pages/EssayWriterPage';
import SentenceRewriterPage from './pages/SentenceRewriterPage';
import ParagraphRewriterPage from './pages/ParagraphRewriterPage';
import ArticleRewriterPage from './pages/ArticleRewriterPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Landing & Studio */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/rewriter" element={<RewriterPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Tools Hub & Sub-Tools */}
          <Route path="/tools" element={<ToolsHubPage />} />
          <Route path="/tools/detector" element={<DetectorPage />} />
          <Route path="/tools/paraphraser" element={<ParaphraserPage />} />
          <Route path="/tools/grammar" element={<GrammarPage />} />
          <Route path="/tools/plagiarism" element={<PlagiarismPage />} />
          <Route path="/tools/essay" element={<EssayWriterPage />} />
          <Route path="/tools/sentence" element={<SentenceRewriterPage />} />
          <Route path="/tools/paragraph" element={<ParagraphRewriterPage />} />
          <Route path="/tools/article" element={<ArticleRewriterPage />} />

          {/* Authenticated User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Informational Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <FloatingChatBot />
    </div>
  );
};

export default App;
