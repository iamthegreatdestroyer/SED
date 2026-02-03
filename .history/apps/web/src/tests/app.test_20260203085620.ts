/**
 * SED - Semantic Entropy Differencing
 * Web Application Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { cn, formatNumber, formatEntropy, truncatePath, formatRelativeDate } from '@/lib/utils';

// Mock zustand
vi.mock('zustand', async () => {
  const actualZustand = await vi.importActual<typeof import('zustand')>('zustand');
  return {
    ...actualZustand,
    create: actualZustand.create,
  };
});

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });

  describe('formatEntropy', () => {
    it('should format entropy to 2 decimal places', () => {
      expect(formatEntropy(1.234)).toBe('1.23');
      expect(formatEntropy(1)).toBe('1.00');
    });
  });

  describe('truncatePath', () => {
    it('should not truncate short paths', () => {
      expect(truncatePath('src/index.ts', 40)).toBe('src/index.ts');
    });

    it('should truncate long paths', () => {
      const longPath = 'src/components/features/dashboard/components/Button.tsx';
      const result = truncatePath(longPath, 30);
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toContain('...');
    });
  });

  describe('formatRelativeDate', () => {
    it('should format recent dates', () => {
      const now = new Date();
      expect(formatRelativeDate(now)).toBe('just now');
    });

    it('should format dates in minutes', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeDate(date)).toBe('5m ago');
    });

    it('should format dates in hours', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeDate(date)).toBe('3h ago');
    });

    it('should format dates in days', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(date)).toBe('2d ago');
    });
  });
});

describe('Analysis Store', () => {
  beforeEach(() => {
    // Reset store state
    useAnalysisStore.setState({
      analysisResult: null,
      isLoading: false,
      error: null,
      history: [],
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAnalysisStore());

    expect(result.current.analysisResult).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useAnalysisStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useAnalysisStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useAnalysisStore());

    act(() => {
      result.current.setError('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should set analysis result and update history', () => {
    const { result } = renderHook(() => useAnalysisStore());

    const mockResult = {
      from: 'HEAD~1',
      to: 'HEAD',
      timestamp: new Date(),
      files: [],
      summary: {
        totalFiles: 0,
        totalEntropy: 0,
        averageEntropy: 0,
        classifications: { trivial: 0, low: 0, medium: 0, high: 0, critical: 0 },
        highestImpact: [],
      },
      stats: { additions: 0, deletions: 0, filesChanged: 0 },
    };

    act(() => {
      result.current.setAnalysisResult(mockResult);
    });

    expect(result.current.analysisResult).toEqual(mockResult);
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toEqual(mockResult);
  });

  it('should limit history to 10 items', () => {
    const { result } = renderHook(() => useAnalysisStore());

    // Add 12 results
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.setAnalysisResult({
          from: `commit-${i}`,
          to: 'HEAD',
          timestamp: new Date(),
          files: [],
          summary: {
            totalFiles: i,
            totalEntropy: 0,
            averageEntropy: 0,
            classifications: { trivial: 0, low: 0, medium: 0, high: 0, critical: 0 },
            highestImpact: [],
          },
          stats: { additions: 0, deletions: 0, filesChanged: 0 },
        });
      });
    }

    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0].from).toBe('commit-11');
  });

  it('should clear history', () => {
    const { result } = renderHook(() => useAnalysisStore());

    act(() => {
      result.current.setAnalysisResult({
        from: 'HEAD~1',
        to: 'HEAD',
        timestamp: new Date(),
        files: [],
        summary: {
          totalFiles: 0,
          totalEntropy: 0,
          averageEntropy: 0,
          classifications: { trivial: 0, low: 0, medium: 0, high: 0, critical: 0 },
          highestImpact: [],
        },
        stats: { additions: 0, deletions: 0, filesChanged: 0 },
      });
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });
});
