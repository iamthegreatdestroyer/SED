/**
 * SED - Semantic Entropy Differencing
 * Config Command Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createConfigCommand } from '../../src/commands/config.js';

// Mock dependencies
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
  access: vi.fn().mockRejectedValue(new Error('File not found')),
}));

vi.mock('../../src/config/loader.js', () => ({
  DEFAULT_CONFIG: {
    threshold: { trivial: 0.5, low: 1.5, medium: 3.0, high: 5.0, critical: 6.0 },
    include: [],
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    languages: ['typescript', 'javascript'],
    output: { format: 'text', color: true },
    git: { followSymlinks: false, ignoreBinaryFiles: true },
  },
  loadConfig: vi.fn().mockResolvedValue({
    threshold: { trivial: 0.5, low: 1.5, medium: 3.0, high: 5.0, critical: 6.0 },
    include: [],
    exclude: ['**/node_modules/**'],
    languages: ['typescript'],
    output: { format: 'text', color: true },
    git: { followSymlinks: false, ignoreBinaryFiles: true },
  }),
  findConfigFile: vi.fn().mockResolvedValue(null),
  validateConfig: vi.fn().mockReturnValue([]),
}));

describe('Config Command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createConfigCommand());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('command creation', () => {
    it('should create config command', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      expect(configCommand).toBeDefined();
    });

    it('should have correct aliases', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const aliases = configCommand?.aliases() ?? [];
      expect(aliases).toContain('c');
    });

    it('should have subcommands', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const subcommands = configCommand?.commands ?? [];
      expect(subcommands.length).toBeGreaterThan(0);
    });
  });

  describe('subcommands', () => {
    it('should have init subcommand', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const initCommand = configCommand?.commands.find((c) => c.name() === 'init');
      expect(initCommand).toBeDefined();
    });

    it('should have show subcommand', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const showCommand = configCommand?.commands.find((c) => c.name() === 'show');
      expect(showCommand).toBeDefined();
    });

    it('should have validate subcommand', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const validateCommand = configCommand?.commands.find((c) => c.name() === 'validate');
      expect(validateCommand).toBeDefined();
    });

    it('should have path subcommand', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const pathCommand = configCommand?.commands.find((c) => c.name() === 'path');
      expect(pathCommand).toBeDefined();
    });
  });

  describe('init subcommand', () => {
    it('should have --format option', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const initCommand = configCommand?.commands.find((c) => c.name() === 'init');
      const options = initCommand?.options ?? [];
      const formatOption = options.find((o) => o.long === '--format');
      expect(formatOption).toBeDefined();
    });

    it('should have --force option', () => {
      const configCommand = program.commands.find((c) => c.name() === 'config');
      const initCommand = configCommand?.commands.find((c) => c.name() === 'init');
      const options = initCommand?.options ?? [];
      const forceOption = options.find((o) => o.long === '--force');
      expect(forceOption).toBeDefined();
    });
  });
});
