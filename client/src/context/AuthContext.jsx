import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('humanly_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount or token change
  const fetchCurrentUser = useCallback(async () => {
    const storedToken = localStorage.getItem('humanly_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out guest:', err.message);
      localStorage.removeItem('humanly_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('humanly_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  // Google login handler
  const loginWithGoogle = async (googlePayload) => {
    const res = await api.post('/auth/google', googlePayload);
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('humanly_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Google authentication failed');
  };

  // Register handler
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('humanly_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('humanly_token');
      setToken(null);
      setUser(null);
    }
  };

  // Update profile
  const updateProfile = async (payload) => {
    const res = await api.patch('/user/profile', payload);
    if (res.data.success) {
      setUser((prev) => ({ ...prev, ...res.data.data }));
      return res.data.data;
    }
  };

  // Refresh quota
  const refreshUserData = async () => {
    await fetchCurrentUser();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
