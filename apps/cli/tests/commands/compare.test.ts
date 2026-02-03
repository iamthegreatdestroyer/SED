/**
 * SED - Semantic Entropy Differencing
 * Compare Command Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createCompareCommand } from '../../src/commands/compare.js';

// Mock dependencies
vi.mock('@sed/core', () => ({
  SEDEngine: vi.fn().mockImplementation(() => ({
    compareFiles: vi.fn().mockResolvedValue({
      classification: 'medium',
      entropy: 2.5,
      metrics: {
        totalEntropy: 2.5,
        additions: 10,
        deletions: 5,
      },
      changes: [],
    }),
  })),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('const x = 1;'),
  access: vi.fn().mockResolvedValue(undefined),
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

describe('Compare Command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createCompareCommand());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('command creation', () => {
    it('should create compare command', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      expect(compareCommand).toBeDefined();
    });

    it('should have correct aliases', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      const aliases = compareCommand?.aliases() ?? [];
      expect(aliases).toContain('cmp');
    });

    it('should have source and target arguments', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      expect(compareCommand?.description()).toContain('Compare');
    });

    it('should have --language option', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      const options = compareCommand?.options ?? [];
      const langOption = options.find((o) => o.long === '--language');
      expect(langOption).toBeDefined();
    });

    it('should have --format option', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      const options = compareCommand?.options ?? [];
      const formatOption = options.find((o) => o.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should have --detailed option', () => {
      const compareCommand = program.commands.find((c) => c.name() === 'compare');
      const options = compareCommand?.options ?? [];
      const detailedOption = options.find((o) => o.long === '--detailed');
      expect(detailedOption).toBeDefined();
    });
  });
});
