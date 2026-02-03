/**
 * SED - Semantic Entropy Differencing
 * Info Command Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createInfoCommand } from '../../src/commands/info.js';

// Mock dependencies
vi.mock('@sed/core', () => ({
  SEDEngine: {
    getSupportedLanguages: vi
      .fn()
      .mockReturnValue(['typescript', 'javascript', 'python', 'java', 'go', 'rust']),
    getVersion: vi.fn().mockReturnValue('0.1.0'),
  },
}));

vi.mock('@sed/git', () => ({
  GitClient: vi.fn().mockImplementation(() => ({
    isGitRepository: vi.fn().mockResolvedValue(true),
    getRepositoryRoot: vi.fn().mockResolvedValue('/test/repo'),
    getCurrentBranch: vi.fn().mockResolvedValue('main'),
    getHeadCommit: vi.fn().mockResolvedValue('abc1234567890'),
    hasUncommittedChanges: vi.fn().mockResolvedValue(false),
  })),
}));

vi.mock('../../src/version.js', () => ({
  version: '0.1.0',
  metadata: {
    name: 'sed',
    version: '0.1.0',
    description: 'Semantic Entropy Differencing CLI',
    homepage: 'https://github.com/sgbilod/sed',
    repository: 'https://github.com/sgbilod/sed',
    author: 'Stevo (sgbilod)',
    license: 'MIT',
  },
}));

describe('Info Command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createInfoCommand());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('command creation', () => {
    it('should create info command', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      expect(infoCommand).toBeDefined();
    });

    it('should have correct aliases', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      const aliases = infoCommand?.aliases() ?? [];
      expect(aliases).toContain('i');
    });

    it('should have description', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      expect(infoCommand?.description()).toContain('Display');
    });

    it('should have --json option', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      const options = infoCommand?.options ?? [];
      const jsonOption = options.find((o) => o.long === '--json');
      expect(jsonOption).toBeDefined();
    });

    it('should have --languages option', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      const options = infoCommand?.options ?? [];
      const langsOption = options.find((o) => o.long === '--languages');
      expect(langsOption).toBeDefined();
    });

    it('should have --system option', () => {
      const infoCommand = program.commands.find((c) => c.name() === 'info');
      const options = infoCommand?.options ?? [];
      const systemOption = options.find((o) => o.long === '--system');
      expect(systemOption).toBeDefined();
    });
  });
});
