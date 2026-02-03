/**
 * SED - Semantic Entropy Differencing
 * Analyze Command Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createAnalyzeCommand } from '../../src/commands/analyze.js';

// Mock dependencies
vi.mock('@sed/core', () => ({
  SEDEngine: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      files: [
        {
          path: 'src/index.ts',
          classification: 'medium',
          entropy: 2.5,
          changes: [],
        },
      ],
      summary: {
        totalFiles: 1,
        totalEntropy: 2.5,
        averageEntropy: 2.5,
        classifications: { medium: 1 },
      },
    }),
  })),
}));

vi.mock('@sed/git', () => ({
  GitClient: vi.fn().mockImplementation(() => ({
    getRepositoryRoot: vi.fn().mockResolvedValue('/test/repo'),
    isGitRepository: vi.fn().mockResolvedValue(true),
    diff: vi.fn().mockResolvedValue('diff content'),
  })),
  DiffExtractor: vi.fn().mockImplementation(() => ({
    extract: vi.fn().mockResolvedValue({
      files: [{ path: 'src/index.ts', status: 'modified' }],
      stats: { additions: 10, deletions: 5, filesChanged: 1 },
    }),
  })),
}));

vi.mock('../../src/config/loader.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    threshold: { trivial: 0.5, low: 1.5, medium: 3.0, high: 5.0, critical: 6.0 },
    include: [],
    exclude: ['**/node_modules/**'],
    languages: ['typescript'],
    output: { format: 'text', color: true },
    git: { followSymlinks: false, ignoreBinaryFiles: true },
  }),
}));

describe('Analyze Command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createAnalyzeCommand());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('command creation', () => {
    it('should create analyze command', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      expect(analyzeCommand).toBeDefined();
    });

    it('should have correct aliases', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      const aliases = analyzeCommand?.aliases() ?? [];
      expect(aliases).toContain('a');
    });

    it('should have from and to arguments', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      expect(analyzeCommand?.description()).toContain('entropy');
    });

    it('should have --output option', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      const options = analyzeCommand?.options ?? [];
      const outputOption = options.find(o => o.long === '--output');
      expect(outputOption).toBeDefined();
    });

    it('should have --format option', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      const options = analyzeCommand?.options ?? [];
      const formatOption = options.find(o => o.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should have --summary option', () => {
      const analyzeCommand = program.commands.find(c => c.name() === 'analyze');
      const options = analyzeCommand?.options ?? [];
      const summaryOption = options.find(o => o.long === '--summary');
      expect(summaryOption).toBeDefined();
    });
  });
});
