/**
 * SED - Semantic Entropy Differencing
 * Analysis Store (Zustand)
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { create } from 'zustand';
import type { AnalysisResult, AnalysisOptions } from '@/types';

interface AnalysisState {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  history: AnalysisResult[];
  
  // Actions
  setAnalysisResult: (result: AnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  runAnalysis: (options: AnalysisOptions) => Promise<void>;
  importResult: (result: AnalysisResult) => void;
  clearHistory: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analysisResult: null,
  isLoading: false,
  error: null,
  history: [],

  setAnalysisResult: (result) => {
    const { history } = get();
    set({
      analysisResult: result,
      history: [result, ...history.slice(0, 9)], // Keep last 10
      error: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  clearError: () => set({ error: null }),

  runAnalysis: async (options) => {
    set({ isLoading: true, error: null });

    try {
      // In a real app, this would call the API
      // For now, simulate an analysis
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock result
      const mockResult: AnalysisResult = {
        from: options.from || 'HEAD~1',
        to: options.to || 'HEAD',
        timestamp: new Date(),
        files: [
          {
            path: '/src/components/Button.tsx',
            relativePath: 'src/components/Button.tsx',
            status: 'modified',
            language: 'typescript',
            classification: 'low',
            entropy: 1.2,
            changes: [],
            metrics: { additions: 5, deletions: 2, modifications: 1 },
          },
          {
            path: '/src/utils/parser.ts',
            relativePath: 'src/utils/parser.ts',
            status: 'modified',
            language: 'typescript',
            classification: 'high',
            entropy: 4.8,
            changes: [],
            metrics: { additions: 45, deletions: 12, modifications: 8 },
          },
          {
            path: '/src/api/client.ts',
            relativePath: 'src/api/client.ts',
            status: 'added',
            language: 'typescript',
            classification: 'medium',
            entropy: 2.5,
            changes: [],
            metrics: { additions: 120, deletions: 0, modifications: 0 },
          },
        ],
        summary: {
          totalFiles: 3,
          totalEntropy: 8.5,
          averageEntropy: 2.83,
          classifications: {
            trivial: 0,
            low: 1,
            medium: 1,
            high: 1,
            critical: 0,
          },
          highestImpact: ['src/utils/parser.ts'],
        },
        stats: {
          additions: 170,
          deletions: 14,
          filesChanged: 3,
        },
      };

      get().setAnalysisResult(mockResult);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Analysis failed',
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  importResult: (result) => {
    get().setAnalysisResult(result);
  },

  clearHistory: () => set({ history: [] }),
}));
