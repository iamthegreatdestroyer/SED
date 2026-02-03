/**
 * SED - Semantic Entropy Differencing
 * CLI Formatters Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AnalysisFormatOptions, FileAnalysisResult, ReportData } from '../src/types.js';

// Mock chalk to avoid color codes in tests
vi.mock('chalk', () => ({
  default: {
    bold: (s: string) => s,
    cyan: (s: string) => s,
    gray: (s: string) => s,
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    bgRed: { white: { bold: (s: string) => s } },
  },
}));

// Import after mocks
const { formatAnalysisAsText, formatCompareAsText, formatError } =
  await import('../src/formatters/text.js');
const { formatAnalysisAsJson, formatCompareAsJson } = await import('../src/formatters/json.js');
const { generateHtmlReport } = await import('../src/formatters/html.js');
const { generateMarkdownReport } = await import('../src/formatters/markdown.js');

describe('Text Formatter', () => {
  const mockResults: FileAnalysisResult[] = [
    {
      file: 'src/index.ts',
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
        changes: [
          { type: 'modified', nodeType: 'function', entropy: 1.5 },
          { type: 'added', nodeType: 'variable', entropy: 1.0 },
        ],
      },
    },
    {
      file: 'src/utils.ts',
      status: 'added',
      language: 'typescript',
      analysis: {
        classification: 'low',
        metrics: {
          totalEntropy: 0.8,
          additions: 20,
          deletions: 0,
          modifications: 0,
        },
        changes: [{ type: 'added', nodeType: 'function', entropy: 0.8 }],
      },
    },
  ];

  const mockOptions: AnalysisFormatOptions = {
    from: 'main',
    to: 'HEAD',
    results: mockResults,
    stats: {
      additions: 30,
      deletions: 5,
      filesChanged: 2,
    },
    format: 'text',
  };

  describe('formatAnalysisAsText', () => {
    it('should format analysis results as text', () => {
      const output = formatAnalysisAsText(mockOptions);

      expect(output).toContain('main');
      expect(output).toContain('HEAD');
      expect(output).toContain('Files Changed');
    });

    it('should show summary only when requested', () => {
      const output = formatAnalysisAsText({
        ...mockOptions,
        summaryOnly: true,
      });

      expect(output).toContain('Files Changed');
      expect(output).not.toContain('Classification Distribution');
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error message');
      const output = formatError(error);

      expect(output).toContain('Error');
      expect(output).toContain('Test error message');
    });

    it('should format string errors', () => {
      const output = formatError('Simple error');
      expect(output).toContain('Simple error');
    });
  });
});

describe('JSON Formatter', () => {
  const mockResults: FileAnalysisResult[] = [
    {
      file: 'src/index.ts',
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
    },
  ];

  describe('formatAnalysisAsJson', () => {
    it('should return valid JSON', () => {
      const output = formatAnalysisAsJson({
        from: 'main',
        to: 'HEAD',
        results: mockResults,
        stats: { additions: 10, deletions: 5, filesChanged: 1 },
        format: 'json',
      });

      const parsed = JSON.parse(output);
      expect(parsed).toBeDefined();
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.from).toBe('main');
      expect(parsed.meta.to).toBe('HEAD');
    });

    it('should include file details by default', () => {
      const output = formatAnalysisAsJson({
        from: 'main',
        to: 'HEAD',
        results: mockResults,
        stats: { additions: 10, deletions: 5, filesChanged: 1 },
        format: 'json',
      });

      const parsed = JSON.parse(output);
      expect(parsed.files).toBeDefined();
      expect(parsed.files).toHaveLength(1);
      expect(parsed.files[0].path).toBe('src/index.ts');
    });

    it('should exclude file details when summary only', () => {
      const output = formatAnalysisAsJson({
        from: 'main',
        to: 'HEAD',
        results: mockResults,
        stats: { additions: 10, deletions: 5, filesChanged: 1 },
        format: 'json',
        summaryOnly: true,
      });

      const parsed = JSON.parse(output);
      expect(parsed.files).toBeUndefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should include summary statistics', () => {
      const output = formatAnalysisAsJson({
        from: 'main',
        to: 'HEAD',
        results: mockResults,
        stats: { additions: 10, deletions: 5, filesChanged: 1 },
        format: 'json',
      });

      const parsed = JSON.parse(output);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalEntropy).toBe(2.5);
      expect(parsed.summary.classifications).toBeDefined();
    });
  });

  describe('formatCompareAsJson', () => {
    it('should format comparison as JSON', () => {
      const output = formatCompareAsJson({
        source: 'file1.ts',
        target: 'file2.ts',
        analysis: {
          classification: 'medium',
          metrics: { totalEntropy: 2.5 },
          changes: [],
        },
        format: 'json',
      });

      const parsed = JSON.parse(output);
      expect(parsed.meta.source).toBe('file1.ts');
      expect(parsed.meta.target).toBe('file2.ts');
      expect(parsed.result.classification).toBe('medium');
    });
  });
});

describe('HTML Report Generator', () => {
  const mockReportData: ReportData = {
    title: 'Test Report',
    from: 'v1.0.0',
    to: 'v2.0.0',
    generatedAt: new Date('2026-01-15T10:00:00Z'),
    repository: {
      root: '/test/repo',
      branch: 'main',
      commit: 'abc1234567890',
      isClean: true,
    },
    stats: {
      additions: 100,
      deletions: 50,
      filesChanged: 10,
      totalCommits: 25,
      conventionalCommits: 20,
      breakingChanges: 2,
    },
    files: [
      {
        file: 'src/index.ts',
        status: 'modified',
        language: 'typescript',
        analysis: {
          classification: 'medium',
          metrics: { totalEntropy: 2.5, additions: 10, deletions: 5, modifications: 3 },
          changes: [],
        },
      },
    ],
    commits: [
      {
        hash: 'abc1234',
        message: 'feat: add new feature',
        author: 'Test Author',
        date: new Date('2026-01-10'),
        isConventional: true,
      },
    ],
    summary: {
      totalFiles: 10,
      successfulAnalyses: 9,
      failedAnalyses: 1,
      classifications: {
        trivial: 2,
        low: 3,
        medium: 3,
        high: 1,
        critical: 0,
      },
      averageEntropy: 2.1,
      totalEntropy: 21.0,
      changes: {
        additions: 100,
        deletions: 50,
        modifications: 30,
      },
      highestImpact: [
        { file: 'src/core.ts', entropy: 5.2, classification: 'high' },
        { file: 'src/index.ts', entropy: 2.5, classification: 'medium' },
      ],
    },
  };

  describe('generateHtmlReport', () => {
    it('should generate valid HTML', () => {
      const html = generateHtmlReport(mockReportData, {});

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include report title', () => {
      const html = generateHtmlReport(mockReportData, {});
      expect(html).toContain('Test Report');
    });

    it('should include statistics', () => {
      const html = generateHtmlReport(mockReportData, {});
      expect(html).toContain('+100'); // additions
      expect(html).toContain('-50'); // deletions
    });

    it('should include classification distribution', () => {
      const html = generateHtmlReport(mockReportData, {});
      expect(html).toContain('Classification Distribution');
    });

    it('should include highest impact files', () => {
      const html = generateHtmlReport(mockReportData, {});
      expect(html).toContain('Highest Impact');
      expect(html).toContain('src/core.ts');
    });

    it('should escape HTML in user content', () => {
      const dataWithXss = {
        ...mockReportData,
        title: '<script>alert("xss")</script>',
      };
      const html = generateHtmlReport(dataWithXss, {});

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});

describe('Markdown Report Generator', () => {
  const mockReportData: ReportData = {
    title: 'Test Report',
    from: 'v1.0.0',
    to: 'v2.0.0',
    generatedAt: new Date('2026-01-15T10:00:00Z'),
    repository: {
      root: '/test/repo',
      branch: 'main',
      commit: 'abc1234567890',
      isClean: true,
    },
    stats: {
      additions: 100,
      deletions: 50,
      filesChanged: 10,
      totalCommits: 25,
      conventionalCommits: 20,
      breakingChanges: 2,
    },
    files: [
      {
        file: 'src/index.ts',
        status: 'modified',
        language: 'typescript',
        analysis: {
          classification: 'medium',
          metrics: { totalEntropy: 2.5, additions: 10, deletions: 5, modifications: 3 },
          changes: [],
        },
      },
    ],
    commits: [
      {
        hash: 'abc1234',
        message: 'feat: add new feature',
        author: 'Test Author',
        date: new Date('2026-01-10'),
        isConventional: true,
      },
    ],
    summary: {
      totalFiles: 10,
      successfulAnalyses: 9,
      failedAnalyses: 1,
      classifications: {
        trivial: 2,
        low: 3,
        medium: 3,
        high: 1,
        critical: 0,
      },
      averageEntropy: 2.1,
      totalEntropy: 21.0,
      changes: {
        additions: 100,
        deletions: 50,
        modifications: 30,
      },
      highestImpact: [{ file: 'src/core.ts', entropy: 5.2, classification: 'high' }],
    },
  };

  describe('generateMarkdownReport', () => {
    it('should generate valid Markdown', () => {
      const md = generateMarkdownReport(mockReportData, {});

      expect(md).toContain('# Test Report');
      expect(md).toContain('## Overview');
    });

    it('should include metadata table', () => {
      const md = generateMarkdownReport(mockReportData, {});
      expect(md).toContain('| From | `v1.0.0` |');
      expect(md).toContain('| To | `v2.0.0` |');
    });

    it('should include summary statistics', () => {
      const md = generateMarkdownReport(mockReportData, {});
      expect(md).toContain('| Files Analyzed | 10 |');
      expect(md).toContain('| Lines Added | +100 |');
    });

    it('should include classification distribution', () => {
      const md = generateMarkdownReport(mockReportData, {});
      expect(md).toContain('Classification Distribution');
      expect(md).toContain('trivial');
      expect(md).toContain('low');
    });

    it('should include highest impact files', () => {
      const md = generateMarkdownReport(mockReportData, {});
      expect(md).toContain('Highest Impact');
      expect(md).toContain('src/core.ts');
    });

    it('should include collapsible file list', () => {
      const md = generateMarkdownReport(mockReportData, {});
      expect(md).toContain('<details>');
      expect(md).toContain('</details>');
    });
  });
});
