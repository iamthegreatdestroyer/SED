/**
 * SED - Semantic Entropy Differencing
 * GitHub Action Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatMarkdownReport, formatPRComment, formatCompactSummary } from '../src/formatter';
import type { AnalysisResult } from '../src/types';

// Mock @actions/core
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  summary: {
    addHeading: vi.fn().mockReturnThis(),
    addTable: vi.fn().mockReturnThis(),
    addBreak: vi.fn().mockReturnThis(),
    addDetails: vi.fn().mockReturnThis(),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @actions/github
vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    payload: {},
  },
  getOctokit: vi.fn(),
}));

describe('Formatter', () => {
  const mockAnalysis: AnalysisResult = {
    from: 'abc123',
    to: 'def456',
    timestamp: '2025-01-01T00:00:00.000Z',
    files: [
      {
        path: '/src/index.ts',
        relativePath: 'src/index.ts',
        status: 'modified',
        language: 'typescript',
        classification: 'medium',
        entropy: 2.5,
        changes: [],
        metrics: { additions: 10, deletions: 5, modifications: 3 },
      },
      {
        path: '/src/utils.ts',
        relativePath: 'src/utils.ts',
        status: 'added',
        language: 'typescript',
        classification: 'low',
        entropy: 1.0,
        changes: [],
        metrics: { additions: 20, deletions: 0, modifications: 0 },
      },
    ],
    summary: {
      totalFiles: 2,
      totalEntropy: 3.5,
      averageEntropy: 1.75,
      classifications: {
        trivial: 0,
        low: 1,
        medium: 1,
        high: 0,
        critical: 0,
      },
      highestImpact: ['src/index.ts'],
    },
  };

  describe('formatMarkdownReport', () => {
    it('should generate a valid markdown report', () => {
      const markdown = formatMarkdownReport(mockAnalysis);

      expect(markdown).toContain('# SED Analysis Report');
      expect(markdown).toContain('abc123');
      expect(markdown).toContain('def456');
      expect(markdown).toContain('2');
      expect(markdown).toContain('3.50');
      expect(markdown).toContain('1.75');
      expect(markdown).toContain('src/index.ts');
      expect(markdown).toContain('src/utils.ts');
    });

    it('should include classification distribution', () => {
      const markdown = formatMarkdownReport(mockAnalysis);

      expect(markdown).toContain('Classification Distribution');
      expect(markdown).toContain('💚 low');
      expect(markdown).toContain('💛 medium');
    });
  });

  describe('formatPRComment', () => {
    it('should generate a valid PR comment', () => {
      const comment = formatPRComment(mockAnalysis);

      expect(comment).toContain('<!-- SED Analysis -->');
      expect(comment).toContain('SED Analysis Results');
      expect(comment).toContain('💚');
      expect(comment).toContain('LOW');
    });

    it('should include summary table', () => {
      const comment = formatPRComment(mockAnalysis);

      expect(comment).toContain('📊 Summary');
      expect(comment).toContain('Files Analyzed | 2');
    });

    it('should include expandable file list', () => {
      const comment = formatPRComment(mockAnalysis);

      expect(comment).toContain('<details>');
      expect(comment).toContain('Top Entropy Files');
    });
  });

  describe('formatCompactSummary', () => {
    it('should generate a compact one-line summary', () => {
      const summary = formatCompactSummary(mockAnalysis);

      expect(summary).toContain('SED:');
      expect(summary).toContain('2 files');
      expect(summary).toContain('3.50');
      expect(summary).toContain('1.75');
      expect(summary).toContain('LOW');
    });

    it('should classify correctly based on average entropy', () => {
      // Trivial
      const trivialResult = { ...mockAnalysis, summary: { ...mockAnalysis.summary, averageEntropy: 0.3 } };
      expect(formatCompactSummary(trivialResult)).toContain('TRIVIAL');

      // Critical
      const criticalResult = { ...mockAnalysis, summary: { ...mockAnalysis.summary, averageEntropy: 5.0 } };
      expect(formatCompactSummary(criticalResult)).toContain('CRITICAL');
    });
  });
});

describe('Types', () => {
  it('should have correct classification values', () => {
    const validClassifications = ['trivial', 'low', 'medium', 'high', 'critical'];

    mockAnalysis.files.forEach((file) => {
      expect(validClassifications).toContain(file.classification);
    });
  });

  it('should have correct status values', () => {
    const validStatuses = ['added', 'modified', 'deleted', 'renamed'];

    mockAnalysis.files.forEach((file) => {
      expect(validStatuses).toContain(file.status);
    });
  });
});
