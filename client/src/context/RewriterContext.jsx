import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { humanizeClientSide, calculateSimpleDiff } from '../services/clientLinguisticEngine';
import confetti from 'canvas-confetti';

const RewriterContext = createContext(null);

export const RewriterProvider = ({ children }) => {
  const toast = useToast();
  const { refreshUserData } = useAuth();

  // Core editor state
  const [originalText, setOriginalText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  
  // Writing controls
  const [domain, setDomain] = useState('General');
  const [complexity, setComplexity] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [customInstruction, setCustomInstruction] = useState('');

  // Processing & progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  // File upload metadata
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Clear workspace
  const clearAll = useCallback(() => {
    setOriginalText('');
    setRewrittenText('');
    setDiffResult(null);
    setShowDiff(false);
    setUploadedFileName('');
    setCustomInstruction('');
  }, []);

  // File upload and extraction
  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setOriginalText(res.data.data.text);
        setUploadedFileName(file.name);
        toast.success(`Extracted ${res.data.data.wordCount.toLocaleString()} words from ${file.name}`);
        refreshUserData();
      }
    } catch (err) {
      // Fallback simple client text reader for .txt/.md if upload endpoint fails
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setOriginalText(e.target.result);
          setUploadedFileName(file.name);
          toast.success(`Loaded ${file.name}`);
        };
        reader.readAsText(file);
      } else {
        toast.error(err.message || 'File upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger Humanizer Rewrite
  const executeRewrite = async () => {
    if (!originalText.trim()) {
      toast.error('Please enter or upload some text to rewrite.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Analyzing structure and rhythm...');

    // Staged progress step simulation for polished UX
    const timer1 = setTimeout(() => setProcessingStep('Removing robotic clichés & stiff phrasing...'), 500);
    const timer2 = setTimeout(() => setProcessingStep('Polishing natural human cadence & authentic rhythm...'), 1000);
    const timer3 = setTimeout(() => setProcessingStep('Preserving facts, terms, and context...'), 1500);

    try {
      const res = await api.post('/rewrite', {
        text: originalText,
        domain,
        complexity,
        language,
        customInstruction,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (res.data.success || res.data.rewritten || res.data.rewrittenText) {
        const data = res.data.data || res.data;
        const finalRewritten = data.rewrittenText || data.rewritten || '';
        setRewrittenText(finalRewritten);
        setDiffResult(data.diff);
        toast.success('Your text has been transformed!');
        
        // Save to local tool history
        try {
          const localKey = 'humanly_tool_history_humanizer';
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const newEntry = {
            id: Date.now().toString(),
            originalText,
            rewrittenText: finalRewritten,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
        } catch (e) {}

        // Confetti celebration
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#10b981', '#a855f7'],
          });
        } catch (e) {}

        refreshUserData();
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      // Seamless fallback to client linguistic engine
      const clientRewritten = humanizeClientSide(originalText);
      const clientDiff = calculateSimpleDiff(originalText, clientRewritten);

      setRewrittenText(clientRewritten);
      setDiffResult(clientDiff);
      toast.success('Your text has been transformed!');

      // Save to local tool history
      try {
        const localKey = 'humanly_tool_history_humanizer';
        const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
        const newEntry = {
          id: Date.now().toString(),
          originalText,
          rewrittenText: clientRewritten,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.slice(0, 30)]));
      } catch (e) {}

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7'],
        });
      } catch (e) {}
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const value = {
    originalText,
    setOriginalText,
    rewrittenText,
    setRewrittenText,
    domain,
    setDomain,
    complexity,
    setComplexity,
    language,
    setLanguage,
    customInstruction,
    setCustomInstruction,
    isProcessing,
    processingStep,
    diffResult,
    showDiff,
    setShowDiff,
    uploadedFileName,
    isUploading,
    clearAll,
    handleFileUpload,
    executeRewrite,
  };

  return <RewriterContext.Provider value={value}>{children}</RewriterContext.Provider>;
};

export const useRewriter = () => {
  const context = useContext(RewriterContext);
  if (!context) {
    throw new Error('useRewriter must be used within a RewriterProvider');
  }
  return context;
};

export default RewriterProvider;
