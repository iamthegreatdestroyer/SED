/**
 * SED - Semantic Entropy Differencing
 * Repository Analyzer Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepoAnalyzer } from '../src/repo-analyzer.js';
import { GitClient } from '../src/git-client.js';

// Create mock GitClient
const createMockGitClient = () => {
  const mockRawGit = {
    raw: vi.fn(),
    getRemotes: vi.fn(),
  };

  return {
    isRepo: vi.fn(),
    getRoot: vi.fn(),
    getCurrentBranch: vi.fn(),
    getCurrentCommit: vi.fn(),
    isClean: vi.fn(),
    getBranches: vi.fn(),
    getTags: vi.fn(),
    getMergeBase: vi.fn(),
    fileExistsAt: vi.fn(),
    getChangedFiles: vi.fn(),
    getRepoPath: vi.fn().mockReturnValue('/test/repo'),
    getRawGit: vi.fn().mockReturnValue(mockRawGit),
    _mockRawGit: mockRawGit,
  };
};

describe('RepoAnalyzer', () => {
  let mockGit: ReturnType<typeof createMockGitClient>;
  let analyzer: RepoAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitClient();
    analyzer = new RepoAnalyzer(mockGit as unknown as GitClient);
  });

  describe('analyze', () => {
    it('should return comprehensive repo info for valid repo', async () => {
      mockGit.isRepo.mockResolvedValue(true);
      mockGit.getRoot.mockResolvedValue('/test/repo');
      mockGit.getCurrentBranch.mockResolvedValue('main');
      mockGit.getCurrentCommit.mockResolvedValue('abc123');
      mockGit.isClean.mockResolvedValue(true);
      mockGit.getBranches.mockResolvedValue({ current: 'main', all: ['main', 'develop'] });
      mockGit.getTags.mockResolvedValue(['v1.0.0', 'v2.0.0']);
      mockGit._mockRawGit.getRemotes.mockResolvedValue([
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/user/repo.git',
            push: 'https://github.com/user/repo.git',
          },
        },
      ]);
      mockGit._mockRawGit.raw.mockImplementation((args: string[]) => {
        if (args[0] === 'rev-list') return '100\n';
        if (args[0] === 'shortlog') return '  10\tAlice\n   5\tBob\n';
        if (args[0] === 'ls-files') return 'file1.ts\nfile2.ts\nfile3.ts\n';
        return '';
      });

      const info = await analyzer.analyze();

      expect(info.isValid).toBe(true);
      expect(info.root).toBe('/test/repo');
      expect(info.currentBranch).toBe('main');
      expect(info.currentCommit).toBe('abc123');
      expect(info.isClean).toBe(true);
      expect(info.branches).toHaveLength(2);
      expect(info.tags).toHaveLength(2);
      expect(info.remotes).toHaveLength(1);
      expect(info.stats.totalCommits).toBe(100);
      expect(info.stats.contributors).toBe(2);
      expect(info.stats.filesTracked).toBe(3);
    });

    it('should return minimal info for invalid repo', async () => {
      mockGit.isRepo.mockResolvedValue(false);

      const info = await analyzer.analyze();

      expect(info.isValid).toBe(false);
      expect(info.branches).toHaveLength(0);
      expect(info.tags).toHaveLength(0);
      expect(info.stats.totalCommits).toBe(0);
    });
  });

  describe('getBranches', () => {
    it('should return branch information', async () => {
      mockGit.getBranches.mockResolvedValue({
        current: 'main',
        all: ['main', 'develop', 'remotes/origin/main'],
      });

      const branches = await analyzer.getBranches();

      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({
        name: 'main',
        isCurrent: true,
        isRemote: false,
      });
      expect(branches[2]).toEqual({
        name: 'origin/main',
        isCurrent: false,
        isRemote: true,
      });
    });
  });

  describe('getTags', () => {
    it('should return tag information', async () => {
      mockGit.getTags.mockResolvedValue(['v1.0.0', 'v2.0.0', 'v3.0.0-beta']);

      const tags = await analyzer.getTags();

      expect(tags).toHaveLength(3);
      expect(tags[0].name).toBe('v1.0.0');
      expect(tags[1].name).toBe('v2.0.0');
      expect(tags[2].name).toBe('v3.0.0-beta');
    });
  });

  describe('getRemotes', () => {
    it('should return remote information', async () => {
      mockGit._mockRawGit.getRemotes.mockResolvedValue([
        {
          name: 'origin',
          refs: {
            fetch: 'git@github.com:user/repo.git',
            push: 'git@github.com:user/repo.git',
          },
        },
        {
          name: 'upstream',
          refs: {
            fetch: 'https://github.com/org/repo.git',
            push: 'https://github.com/org/repo.git',
          },
        },
      ]);

      const remotes = await analyzer.getRemotes();

      expect(remotes).toHaveLength(2);
      expect(remotes[0]).toEqual({
        name: 'origin',
        fetchUrl: 'git@github.com:user/repo.git',
        pushUrl: 'git@github.com:user/repo.git',
      });
      expect(remotes[1].name).toBe('upstream');
    });
  });

  describe('getStats', () => {
    it('should calculate repository statistics', async () => {
      mockGit.getBranches.mockResolvedValue({
        current: 'main',
        all: ['main', 'develop', 'remotes/origin/main'],
      });
      mockGit.getTags.mockResolvedValue(['v1.0.0', 'v2.0.0']);
      mockGit._mockRawGit.raw.mockImplementation((args: string[]) => {
        if (args[0] === 'rev-list') return '250\n';
        if (args[0] === 'shortlog') return '  50\tAlice\n  30\tBob\n  20\tCharlie\n';
        if (args[0] === 'ls-files') return 'a.ts\nb.ts\nc.ts\nd.ts\ne.ts\n';
        return '';
      });

      const stats = await analyzer.getStats();

      expect(stats.totalCommits).toBe(250);
      expect(stats.totalBranches).toBe(2); // Excludes remotes
      expect(stats.totalTags).toBe(2);
      expect(stats.contributors).toBe(3);
      expect(stats.filesTracked).toBe(5);
    });

    it('should handle errors gracefully', async () => {
      mockGit.getBranches.mockRejectedValue(new Error('Git error'));

      const stats = await analyzer.getStats();

      expect(stats.totalCommits).toBe(0);
      expect(stats.contributors).toBe(0);
    });
  });

  describe('getFileTree', () => {
    it('should return file tree at HEAD', async () => {
      mockGit._mockRawGit.raw.mockResolvedValue('src/index.ts\nsrc/utils.ts\nREADME.md\n');

      const tree = await analyzer.getFileTree();

      expect(tree).toHaveLength(3);
      expect(tree[0]).toEqual({
        path: 'src/index.ts',
        name: 'index.ts',
        type: 'file',
        language: 'typescript',
      });
      expect(tree[2].language).toBeUndefined(); // .md not in language map
    });

    it('should filter by path', async () => {
      mockGit._mockRawGit.raw.mockResolvedValue('src/file.ts\n');

      await analyzer.getFileTree('HEAD', 'src/');

      expect(mockGit._mockRawGit.raw).toHaveBeenCalledWith([
        'ls-tree',
        '-r',
        '--name-only',
        'HEAD',
        '--',
        'src/',
      ]);
    });

    it('should handle empty result', async () => {
      mockGit._mockRawGit.raw.mockRejectedValue(new Error('Not a tree'));

      const tree = await analyzer.getFileTree();

      expect(tree).toEqual([]);
    });
  });

  describe('getChangedFilesSince', () => {
    it('should return changed file paths', async () => {
      mockGit.getChangedFiles.mockResolvedValue([
        { path: 'src/a.ts', status: 'modified', additions: 1, deletions: 1 },
        { path: 'src/b.ts', status: 'added', additions: 10, deletions: 0 },
      ]);

      const files = await analyzer.getChangedFilesSince('v1.0.0');

      expect(files).toEqual(['src/a.ts', 'src/b.ts']);
    });
  });

  describe('findMergeBase', () => {
    it('should find merge base between current and target branch', async () => {
      mockGit.getCurrentBranch.mockResolvedValue('feature');
      mockGit.getMergeBase.mockResolvedValue('abc123');

      const base = await analyzer.findMergeBase('main');

      expect(base).toBe('abc123');
      expect(mockGit.getMergeBase).toHaveBeenCalledWith('feature', 'main');
    });
  });

  describe('getBlame', () => {
    it('should return blame information', async () => {
      const blameOutput = `abc123def456789abc123def456789abc123def4 1 1 1
author Alice
author-mail <alice@example.com>
author-time 1704067200
author-tz +0000
committer Alice
committer-mail <alice@example.com>
committer-time 1704067200
committer-tz +0000
summary Initial commit
filename test.ts
	const x = 1;`;

      mockGit._mockRawGit.raw.mockResolvedValue(blameOutput);

      const blame = await analyzer.getBlame('test.ts');

      expect(blame).toHaveLength(1);
      expect(blame[0].commit).toBe('abc123def456789abc123def456789abc123def4');
      expect(blame[0].author).toBe('Alice');
      expect(blame[0].content).toBe('const x = 1;');
    });

    it('should handle blame errors', async () => {
      mockGit._mockRawGit.raw.mockRejectedValue(new Error('Blame failed'));

      const blame = await analyzer.getBlame('nonexistent.ts');

      expect(blame).toEqual([]);
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockGit.fileExistsAt.mockResolvedValue(true);

      const exists = await analyzer.fileExists('src/index.ts');

      expect(exists).toBe(true);
      expect(mockGit.fileExistsAt).toHaveBeenCalledWith('src/index.ts', 'HEAD');
    });

    it('should check at specific ref', async () => {
      mockGit.fileExistsAt.mockResolvedValue(false);

      const exists = await analyzer.fileExists('src/new.ts', 'v1.0.0');

      expect(exists).toBe(false);
      expect(mockGit.fileExistsAt).toHaveBeenCalledWith('src/new.ts', 'v1.0.0');
    });
  });

  describe('getLastModification', () => {
    it('should return last modification info', async () => {
      mockGit._mockRawGit.raw.mockResolvedValue(
        'abc123|Alice|2024-01-15T10:00:00Z|feat: add feature\n'
      );

      const mod = await analyzer.getLastModification('src/file.ts');

      expect(mod).not.toBeNull();
      expect(mod?.commit).toBe('abc123');
      expect(mod?.author).toBe('Alice');
      expect(mod?.message).toBe('feat: add feature');
      expect(mod?.date).toBeInstanceOf(Date);
    });

    it('should return null for untracked file', async () => {
      mockGit._mockRawGit.raw.mockResolvedValue('');

      const mod = await analyzer.getLastModification('untracked.ts');

      expect(mod).toBeNull();
    });

    it('should handle errors', async () => {
      mockGit._mockRawGit.raw.mockRejectedValue(new Error('File not in repo'));

      const mod = await analyzer.getLastModification('unknown.ts');

      expect(mod).toBeNull();
    });
  });

  describe('language detection', () => {
    it('should detect languages from file extensions', async () => {
      mockGit._mockRawGit.raw.mockResolvedValue(
        'file.ts\nfile.js\nfile.py\nfile.rs\nfile.go\nfile.java\n'
      );

      const tree = await analyzer.getFileTree();

      expect(tree[0].language).toBe('typescript');
      expect(tree[1].language).toBe('javascript');
      expect(tree[2].language).toBe('python');
      expect(tree[3].language).toBe('rust');
      expect(tree[4].language).toBe('go');
      expect(tree[5].language).toBe('java');
    });
  });
});
