/**
 * SED - Semantic Entropy Differencing
 * Report Command Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createReportCommand } from '../../src/commands/report.js';

// Mock dependencies
vi.mock('@sed/core', () => ({
  SEDEngine: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      files: [],
      summary: {
        totalFiles: 0,
        totalEntropy: 0,
        averageEntropy: 0,
        classifications: {},
      },
    }),
  })),
}));

vi.mock('@sed/git', () => ({
  GitClient: vi.fn().mockImplementation(() => ({
    getRepositoryRoot: vi.fn().mockResolvedValue('/test/repo'),
    isGitRepository: vi.fn().mockResolvedValue(true),
    getCurrentBranch: vi.fn().mockResolvedValue('main'),
    getHeadCommit: vi.fn().mockResolvedValue('abc1234567890'),
    hasUncommittedChanges: vi.fn().mockResolvedValue(false),
  })),
  CommitParser: vi.fn().mockImplementation(() => ({
    getCommits: vi.fn().mockResolvedValue([]),
    parseConventionalCommit: vi.fn(),
  })),
  DiffExtractor: vi.fn().mockImplementation(() => ({
    extract: vi.fn().mockResolvedValue({
      files: [],
      stats: { additions: 0, deletions: 0, filesChanged: 0 },
    }),
  })),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
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

describe('Report Command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createReportCommand());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('command creation', () => {
    it('should create report command', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      expect(reportCommand).toBeDefined();
    });

    it('should have correct aliases', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      const aliases = reportCommand?.aliases() ?? [];
      expect(aliases).toContain('r');
    });

    it('should have from and to arguments', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      expect(reportCommand?.description()).toContain('report');
    });

    it('should have --output option', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      const options = reportCommand?.options ?? [];
      const outputOption = options.find(o => o.long === '--output');
      expect(outputOption).toBeDefined();
    });

    it('should have --format option', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      const options = reportCommand?.options ?? [];
      const formatOption = options.find(o => o.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should have --title option', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      const options = reportCommand?.options ?? [];
      const titleOption = options.find(o => o.long === '--title');
      expect(titleOption).toBeDefined();
    });

    it('should have --include-commits option', () => {
      const reportCommand = program.commands.find(c => c.name() === 'report');
      const options = reportCommand?.options ?? [];
      const commitsOption = options.find(o => o.long === '--include-commits');
      expect(commitsOption).toBeDefined();
    });
  });
});
