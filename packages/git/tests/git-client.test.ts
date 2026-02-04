/**
 * SED - Semantic Entropy Differencing
 * Git Client Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SimpleGit } from 'simple-git';

// Create mock git instance with all methods
const mockGit: SimpleGit = {
  checkIsRepo: vi.fn(),
  revparse: vi.fn(),
  show: vi.fn(),
  diff: vi.fn(),
  diffSummary: vi.fn(),
  log: vi.fn(),
  raw: vi.fn(),
  branch: vi.fn(),
  tags: vi.fn(),
  status: vi.fn(),
} as any;

// Make mockGit available to the mocked module
(global as any).testMockGit = mockGit;

// Mock the simple-git module BEFORE importing GitClient
vi.mock('simple-git', () => {
  // Return a function that when called, returns mockGit
  // We can't use mockGit directly here due to hoisting
  const mockFactory = (options: any) => {
    // Access mockGit at call time, not definition time
    return (global as any).testMockGit;
  };

  return {
    simpleGit: mockFactory,
  };
});

// Import GitClient AFTER mocking
import { GitClient, GitClientOptions } from '../src/git-client.js';

describe('GitClient', () => {
  let client: GitClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // mockGit is now accessible since it's defined before vi.mock()
    client = new GitClient('/test/repo');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const c = new GitClient('/some/path');
      // Path should be normalized/resolved - on Windows it will include drive letter
      expect(c.getRepoPath()).toContain('some');
      expect(c.getRepoPath()).toContain('path');
    });

    it('should accept custom options', () => {
      const options: GitClientOptions = {
        timeout: 60000,
        maxBuffer: 100 * 1024 * 1024,
        binary: '/usr/bin/git',
      };
      const c = new GitClient('/repo', options);
      expect(c).toBeDefined();
    });
  });

  describe('isRepo', () => {
    it('should return true for valid repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);

      const result = await client.isRepo();

      expect(result).toBe(true);
      expect(mockGit.checkIsRepo).toHaveBeenCalled();
    });

    it('should return false for non-repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false);

      const result = await client.isRepo();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockGit.checkIsRepo.mockRejectedValue(new Error('Not a git repo'));

      const result = await client.isRepo();

      expect(result).toBe(false);
    });
  });

  describe('getRoot', () => {
    it('should return repository root path', async () => {
      mockGit.revparse.mockResolvedValue('/test/repo\n');

      const root = await client.getRoot();

      expect(root).toBe('/test/repo');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--show-toplevel']);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockGit.revparse.mockResolvedValue('main\n');

      const branch = await client.getCurrentBranch();

      expect(branch).toBe('main');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
    });
  });

  describe('getCurrentCommit', () => {
    it('should return current commit hash', async () => {
      mockGit.revparse.mockResolvedValue('abc123def456\n');

      const commit = await client.getCurrentCommit();

      expect(commit).toBe('abc123def456');
      expect(mockGit.revparse).toHaveBeenCalledWith(['HEAD']);
    });
  });

  describe('getAbbreviatedCommit', () => {
    it('should return abbreviated commit hash', async () => {
      mockGit.revparse.mockResolvedValue('abc123\n');

      const commit = await client.getAbbreviatedCommit();

      expect(commit).toBe('abc123');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--short', 'HEAD']);
    });

    it('should accept custom ref', async () => {
      mockGit.revparse.mockResolvedValue('def456\n');

      await client.getAbbreviatedCommit('feature-branch');

      expect(mockGit.revparse).toHaveBeenCalledWith(['--short', 'feature-branch']);
    });
  });

  describe('getFileContent', () => {
    it('should return file content at HEAD', async () => {
      mockGit.show.mockResolvedValue('console.log("hello");');

      const content = await client.getFileContent('src/index.ts');

      expect(content).toBe('console.log("hello");');
      expect(mockGit.show).toHaveBeenCalledWith(['HEAD:src/index.ts']);
    });

    it('should return file content at specific ref', async () => {
      mockGit.show.mockResolvedValue('const x = 1;');

      const content = await client.getFileContent('src/file.ts', 'v1.0.0');

      expect(content).toBe('const x = 1;');
      expect(mockGit.show).toHaveBeenCalledWith(['v1.0.0:src/file.ts']);
    });

    it('should throw for non-existent file', async () => {
      mockGit.show.mockRejectedValue(new Error('fatal: path not found'));

      await expect(client.getFileContent('nonexistent.ts', 'HEAD')).rejects.toThrow();
    });
  });

  describe('fileExistsAt', () => {
    it('should return true when file exists', async () => {
      mockGit.show.mockResolvedValue('content');

      const exists = await client.fileExistsAt('src/index.ts');

      expect(exists).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockGit.show.mockRejectedValue(new Error('not found'));

      const exists = await client.fileExistsAt('nonexistent.ts');

      expect(exists).toBe(false);
    });
  });

  describe('getChangedFiles', () => {
    it('should return list of changed files', async () => {
      mockGit.diffSummary.mockResolvedValue({
        files: [
          { file: 'src/new.ts', insertions: 10, deletions: 0 },
          { file: 'src/modified.ts', insertions: 5, deletions: 3 },
          { file: 'src/deleted.ts', insertions: 0, deletions: 20 },
        ],
      });

      const changes = await client.getChangedFiles('v1.0.0', 'v2.0.0');

      expect(changes).toHaveLength(3);
      expect(changes[0]).toEqual({
        path: 'src/new.ts',
        status: 'added',
        additions: 10,
        deletions: 0,
      });
      expect(changes[1]).toEqual({
        path: 'src/modified.ts',
        status: 'modified',
        additions: 5,
        deletions: 3,
      });
      expect(changes[2]).toEqual({
        path: 'src/deleted.ts',
        status: 'deleted',
        additions: 0,
        deletions: 20,
      });
    });
  });

  describe('getDiff', () => {
    it('should return diff between refs', async () => {
      mockGit.diff.mockResolvedValue('diff --git a/file.ts...');

      const diff = await client.getDiff('v1.0.0', 'v2.0.0');

      expect(diff).toBe('diff --git a/file.ts...');
    });

    it('should accept unified context option', async () => {
      mockGit.diff.mockResolvedValue('diff output');

      await client.getDiff('v1', 'v2', { unified: 5 });

      expect(mockGit.diff).toHaveBeenCalledWith(['-U5', 'v1', 'v2']);
    });

    it('should accept path filter', async () => {
      mockGit.diff.mockResolvedValue('diff output');

      await client.getDiff('v1', 'v2', { paths: ['src/'] });

      expect(mockGit.diff).toHaveBeenCalledWith(['v1', 'v2', '--', 'src/']);
    });
  });

  describe('getFileDiff', () => {
    it('should return diff for specific file', async () => {
      mockGit.diff.mockResolvedValue('--- a/file.ts\n+++ b/file.ts');

      const diff = await client.getFileDiff('src/file.ts', 'v1', 'v2');

      expect(mockGit.diff).toHaveBeenCalledWith(['v1', 'v2', '--', 'src/file.ts']);
    });
  });

  describe('getBranches', () => {
    it('should return all branches', async () => {
      mockGit.branch.mockResolvedValue({
        current: 'main',
        all: ['main', 'develop', 'remotes/origin/main'],
      });

      const result = await client.getBranches();

      expect(result.current).toBe('main');
      expect(result.all).toContain('main');
      expect(result.all).toContain('develop');
    });
  });

  describe('getTags', () => {
    it('should return all tags', async () => {
      mockGit.tags.mockResolvedValue({
        all: ['v1.0.0', 'v1.1.0', 'v2.0.0'],
      });

      const tags = await client.getTags();

      expect(tags).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0']);
    });
  });

  describe('getMergeBase', () => {
    it('should return merge base commit', async () => {
      mockGit.raw.mockResolvedValue('abc123\n');

      const base = await client.getMergeBase('main', 'feature');

      expect(base).toBe('abc123');
      expect(mockGit.raw).toHaveBeenCalledWith(['merge-base', 'main', 'feature']);
    });
  });

  describe('isClean', () => {
    it('should return true for clean working directory', async () => {
      mockGit.status.mockResolvedValue({ isClean: () => true });

      const clean = await client.isClean();

      expect(clean).toBe(true);
    });

    it('should return false for dirty working directory', async () => {
      mockGit.status.mockResolvedValue({ isClean: () => false });

      const clean = await client.isClean();

      expect(clean).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return working directory status', async () => {
      mockGit.status.mockResolvedValue({
        staged: ['file1.ts'],
        modified: ['file2.ts'],
        not_added: ['file3.ts'],
        isClean: () => false,
      });

      const status = await client.getStatus();

      expect(status).toEqual({
        staged: ['file1.ts'],
        modified: ['file2.ts'],
        untracked: ['file3.ts'],
        isClean: false,
      });
    });
  });

  describe('getRawGit', () => {
    it('should return underlying simple-git instance', () => {
      const raw = client.getRawGit();

      expect(raw).toBeDefined();
    });
  });
});
