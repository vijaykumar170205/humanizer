import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Home,
  PenTool,
  Wand2,
  ScanEye,
  ShieldCheck,
  History,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  CreditCard,
  ChevronDown,
  Gauge,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 select-none group cursor-pointer">
              <img
                src="/cutm-logo.png"
                alt="Centurion University of Technology and Management Logo"
                className="h-10 w-10 object-contain rounded-full drop-shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700 dark:from-white dark:via-indigo-200 dark:to-brand-400 bg-clip-text text-transparent tracking-tight">
                Humanoider
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/')
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Home</span>
              </Link>

              <Link
                to="/rewriter"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/rewriter')
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PenTool className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Studio</span>
              </Link>

              <Link
                to="/tools"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/tools')
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Wand2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Tools Hub</span>
              </Link>

              <Link
                to="/pricing"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/pricing')
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Quota indicator */}
                <div className="hidden lg:flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Gauge className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mr-1.5" />
                  <span>
                    {(user.wordLimit - user.wordsUsed).toLocaleString()} words left
                  </span>
                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300 text-[10px] font-bold uppercase">
                    {user.plan}
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-slide-up"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>User Dashboard</span>
                      </Link>

                      <Link
                        to="/history"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <History className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>Rewrite History</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Account Settings</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors font-medium"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      {/* Dark Mode Toggle Option inside Top Right Dropdown */}
                      <div className="border-t border-slate-100 dark:border-slate-700 my-1 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTheme();
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center space-x-2.5">
                            {isDark ? (
                              <Moon className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Sun className="w-4 h-4 text-amber-500" />
                            )}
                            <span>Dark Mode</span>
                          </div>
                          <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3" ref={dropdownRef}>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Get Started Free
                </Link>

                {/* Guest Settings / Theme Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 cursor-pointer flex items-center space-x-1"
                    title="Appearance & Settings"
                  >
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-slide-up"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Preferences</p>
                      </div>

                      {/* Dark Mode Toggle Option inside Top Right Dropdown */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTheme();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center space-x-2.5">
                          {isDark ? (
                            <Moon className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Sun className="w-4 h-4 text-amber-500" />
                          )}
                          <span>Dark Mode</span>
                        </div>
                        <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <Link
                          to="/login"
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span>Sign In</span>
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span>Create Free Account</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/')
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Home className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Home</span>
          </Link>
          <Link
            to="/rewriter"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <PenTool className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Studio Rewriter</span>
          </Link>
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Wand2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Tools Hub</span>
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Pricing</span>
          </Link>

          {/* Dark mode toggle row in mobile nav dropdown */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {isAuthenticated ? (
            <>
              <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LayoutDashboard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <History className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>History</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 mt-2 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 flex flex-col space-y-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-slate-700 dark:text-slate-200 font-medium rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow-md"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
