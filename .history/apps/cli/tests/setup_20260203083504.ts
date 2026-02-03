/**
 * SED - Semantic Entropy Differencing
 * CLI Test Setup
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Setup console mocks
beforeAll(() => {
  // Suppress console output during tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
export function createMockAnalysisResult(overrides = {}) {
  return {
    file: 'test.ts',
    status: 'modified',
    language: 'typescript',
    analysis: {
      classification: 'medium',
      metrics: {
        totalEntropy: 2.5,
        additions: 10,
        deletions: 5,
        modifications: 3,
      },
      changes: [],
    },
    ...overrides,
  };
}

export function createMockConfig(overrides = {}) {
  return {
    threshold: {
      trivial: 0.5,
      low: 1.5,
      medium: 3.0,
      high: 5.0,
      critical: 6.0,
    },
    include: [],
    exclude: ['**/node_modules/**'],
    languages: ['typescript', 'javascript'],
    output: {
      format: 'text' as const,
      color: true,
    },
    git: {
      followSymlinks: false,
      ignoreBinaryFiles: true,
    },
    ...overrides,
  };
}
