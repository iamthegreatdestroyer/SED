/**
 * SED - Semantic Entropy Differencing
 * Commit Parser Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommitParser } from '../src/commit-parser.js';
import { GitClient, LogEntry } from '../src/git-client.js';

// Create mock GitClient
const createMockGitClient = () => ({
  getLog: vi.fn(),
  getRawGit: vi.fn(() => ({
    raw: vi.fn(),
  })),
});

describe('CommitParser', () => {
  let mockGit: ReturnType<typeof createMockGitClient>;
  let parser: CommitParser;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitClient();
    parser = new CommitParser(mockGit as unknown as GitClient);
  });

  describe('parse', () => {
    it('should parse a single commit', async () => {
      const logEntry: LogEntry = {
        hash: 'abc123def456',
        abbreviatedHash: 'abc123',
        author: 'John Doe',
        authorEmail: 'john@example.com',
        date: new Date('2024-01-15'),
        message: 'feat(core): add new feature',
        body: '',
        refs: ['main'],
      };

      mockGit.getLog.mockResolvedValue([logEntry]);

      const commit = await parser.parse('abc123');

      expect(commit.hash).toBe('abc123def456');
      expect(commit.abbreviatedHash).toBe('abc123');
      expect(commit.author.name).toBe('John Doe');
      expect(commit.author.email).toBe('john@example.com');
      expect(commit.isConventional).toBe(true);
      expect(commit.conventional?.type).toBe('feat');
      expect(commit.conventional?.scope).toBe('core');
    });

    it('should throw for non-existent commit', async () => {
      mockGit.getLog.mockResolvedValue([]);

      await expect(parser.parse('nonexistent')).rejects.toThrow('Commit not found');
    });
  });

  describe('parseRange', () => {
    it('should parse a range of commits', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'aaa111',
          abbreviatedHash: 'aaa',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15'),
          message: 'feat: feature 1',
          body: '',
          refs: [],
        },
        {
          hash: 'bbb222',
          abbreviatedHash: 'bbb',
          author: 'Bob',
          authorEmail: 'bob@example.com',
          date: new Date('2024-01-14'),
          message: 'fix: bug fix',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const range = await parser.parseRange('v1.0.0', 'v2.0.0');

      expect(range.from).toBe('v1.0.0');
      expect(range.to).toBe('v2.0.0');
      expect(range.commits).toHaveLength(2);
      expect(range.totalCommits).toBe(2);
    });
  });

  describe('parseRecent', () => {
    it('should parse recent commits', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'abc123',
          abbreviatedHash: 'abc',
          author: 'Test',
          authorEmail: 'test@example.com',
          date: new Date(),
          message: 'docs: update readme',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const commits = await parser.parseRecent(10);

      expect(commits).toHaveLength(1);
      expect(mockGit.getLog).toHaveBeenCalledWith({ maxCount: 10 });
    });
  });

  describe('parseConventionalMessage', () => {
    it('should parse basic conventional commit', () => {
      const result = parser.parseConventionalMessage('feat: add new feature');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('feat');
      expect(result?.description).toBe('add new feature');
      expect(result?.scope).toBeUndefined();
      expect(result?.breaking).toBe(false);
    });

    it('should parse conventional commit with scope', () => {
      const result = parser.parseConventionalMessage('fix(auth): resolve login issue');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('fix');
      expect(result?.scope).toBe('auth');
      expect(result?.description).toBe('resolve login issue');
    });

    it('should parse breaking change with exclamation', () => {
      const result = parser.parseConventionalMessage('feat(api)!: change response format');

      expect(result).not.toBeNull();
      expect(result?.breaking).toBe(true);
    });

    it('should parse breaking change in footer', () => {
      const message = `feat: new feature

This is the body.

BREAKING CHANGE: old API removed`;

      const result = parser.parseConventionalMessage(message);

      expect(result).not.toBeNull();
      expect(result?.breaking).toBe(true);
      expect(result?.breakingDescription).toBe('old API removed');
    });

    it('should parse body content', () => {
      const message = `docs: update documentation

This is the body content.
It spans multiple lines.`;

      const result = parser.parseConventionalMessage(message);

      expect(result?.body).toContain('This is the body content.');
    });

    it('should return null for non-conventional messages', () => {
      expect(parser.parseConventionalMessage('Random commit message')).toBeNull();
      expect(parser.parseConventionalMessage('WIP: work in progress')).toBeNull();
      expect(parser.parseConventionalMessage('Update readme')).toBeNull();
    });

    it('should recognize all standard types', () => {
      const types = [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ];

      for (const type of types) {
        const result = parser.parseConventionalMessage(`${type}: test message`);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(type);
      }
    });
  });

  describe('isConventional', () => {
    it('should return true for conventional commits', () => {
      expect(parser.isConventional('feat: add feature')).toBe(true);
      expect(parser.isConventional('fix(core): bug fix')).toBe(true);
      expect(parser.isConventional('chore!: breaking change')).toBe(true);
    });

    it('should return false for non-conventional commits', () => {
      expect(parser.isConventional('Random message')).toBe(false);
      expect(parser.isConventional('Add new feature')).toBe(false);
      expect(parser.isConventional('WIP')).toBe(false);
    });
  });

  describe('getTypeStats', () => {
    it('should count commits by type', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: f1',
          body: '',
          refs: [],
        },
        {
          hash: 'b',
          abbreviatedHash: 'b',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: f2',
          body: '',
          refs: [],
        },
        {
          hash: 'c',
          abbreviatedHash: 'c',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix: b1',
          body: '',
          refs: [],
        },
        {
          hash: 'd',
          abbreviatedHash: 'd',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'Random',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const stats = await parser.getTypeStats('v1', 'v2');

      expect(stats.feat).toBe(2);
      expect(stats.fix).toBe(1);
      expect(stats.other).toBe(1);
    });
  });

  describe('getBreakingChanges', () => {
    it('should return only breaking change commits', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: normal',
          body: '',
          refs: [],
        },
        {
          hash: 'b',
          abbreviatedHash: 'b',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat!: breaking',
          body: '',
          refs: [],
        },
        {
          hash: 'c',
          abbreviatedHash: 'c',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix: normal fix',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const breaking = await parser.getBreakingChanges('v1', 'v2');

      expect(breaking).toHaveLength(1);
      expect(breaking[0].hash).toBe('b');
    });
  });

  describe('filterByType', () => {
    it('should filter commits by type', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: f1',
          body: '',
          refs: [],
        },
        {
          hash: 'b',
          abbreviatedHash: 'b',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix: b1',
          body: '',
          refs: [],
        },
        {
          hash: 'c',
          abbreviatedHash: 'c',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'docs: d1',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);
      const range = await parser.parseRange('v1', 'v2');

      const features = parser.filterByType(range.commits, ['feat']);
      expect(features).toHaveLength(1);

      const featsAndFixes = parser.filterByType(range.commits, ['feat', 'fix']);
      expect(featsAndFixes).toHaveLength(2);
    });
  });

  describe('filterByScope', () => {
    it('should filter commits by scope', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat(core): f1',
          body: '',
          refs: [],
        },
        {
          hash: 'b',
          abbreviatedHash: 'b',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix(api): b1',
          body: '',
          refs: [],
        },
        {
          hash: 'c',
          abbreviatedHash: 'c',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: no scope',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);
      const range = await parser.parseRange('v1', 'v2');

      const coreCommits = parser.filterByScope(range.commits, ['core']);
      expect(coreCommits).toHaveLength(1);
      expect(coreCommits[0].conventional?.scope).toBe('core');
    });
  });

  describe('generateChangelog', () => {
    it('should generate flat changelog', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'abc123',
          abbreviatedHash: 'abc',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: feature 1',
          body: '',
          refs: [],
        },
        {
          hash: 'def456',
          abbreviatedHash: 'def',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix: bug fix',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const changelog = await parser.generateChangelog('v1', 'v2');

      expect(changelog).toContain('# Changelog');
      expect(changelog).toContain('feat: feature 1');
      expect(changelog).toContain('fix: bug fix');
      expect(changelog).toContain('abc');
      expect(changelog).toContain('def');
    });

    it('should generate grouped changelog', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: new feature',
          body: '',
          refs: [],
        },
        {
          hash: 'b',
          abbreviatedHash: 'b',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'fix: bug fix',
          body: '',
          refs: [],
        },
        {
          hash: 'c',
          abbreviatedHash: 'c',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'docs: documentation',
          body: '',
          refs: [],
        },
        {
          hash: 'd',
          abbreviatedHash: 'd',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat!: breaking feature',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const changelog = await parser.generateChangelog('v1', 'v2', { grouped: true });

      expect(changelog).toContain('# Changelog');
      expect(changelog).toContain('## ⚠️ Breaking Changes');
      expect(changelog).toContain('## ✨ Features');
      expect(changelog).toContain('## 🐛 Bug Fixes');
      expect(changelog).toContain('## 📚 Documentation');
    });

    it('should handle commits with scopes in grouped changelog', async () => {
      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat(auth): login feature',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);

      const changelog = await parser.generateChangelog('v1', 'v2', { grouped: true });

      expect(changelog).toContain('**auth:**');
      expect(changelog).toContain('login feature');
    });
  });

  describe('options', () => {
    it('should respect maxCommits option', async () => {
      const parserWithLimit = new CommitParser(mockGit as unknown as GitClient, {
        maxCommits: 50,
      });

      mockGit.getLog.mockResolvedValue([]);
      await parserWithLimit.parseRecent(100);

      expect(mockGit.getLog).toHaveBeenCalledWith({ maxCount: 50 });
    });

    it('should disable conventional parsing', async () => {
      const parserNoConventional = new CommitParser(mockGit as unknown as GitClient, {
        parseConventional: false,
      });

      const logs: LogEntry[] = [
        {
          hash: 'a',
          abbreviatedHash: 'a',
          author: '',
          authorEmail: '',
          date: new Date(),
          message: 'feat: feature',
          body: '',
          refs: [],
        },
      ];

      mockGit.getLog.mockResolvedValue(logs);
      const commit = await parserNoConventional.parse('a');

      expect(commit.isConventional).toBe(false);
      expect(commit.conventional).toBeUndefined();
    });
  });
});
