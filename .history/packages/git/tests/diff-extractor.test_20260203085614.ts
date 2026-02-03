/**
 * SED - Semantic Entropy Differencing
 * Diff Extractor Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiffExtractor } from '../src/diff-extractor.js';
import { GitClient, FileChange } from '../src/git-client.js';

// Create mock GitClient
const createMockGitClient = () => ({
  getChangedFiles: vi.fn(),
  getFileContent: vi.fn(),
  getFileDiff: vi.fn(),
  getDiff: vi.fn(),
  getRepoPath: vi.fn().mockReturnValue('/test/repo'),
});

describe('DiffExtractor', () => {
  let mockGit: ReturnType<typeof createMockGitClient>;
  let extractor: DiffExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitClient();
    extractor = new DiffExtractor(mockGit as unknown as GitClient);
  });

  describe('extractDiff', () => {
    it('should extract diff with all file information', async () => {
      const changes: FileChange[] = [
        { path: 'src/index.ts', status: 'modified', additions: 10, deletions: 5 },
        { path: 'src/new.py', status: 'added', additions: 20, deletions: 0 },
      ];

      mockGit.getChangedFiles.mockResolvedValue(changes);
      mockGit.getFileContent.mockImplementation(async (path, ref) => {
        if (path === 'src/index.ts' && ref === 'v1') return 'old content';
        if (path === 'src/index.ts' && ref === 'HEAD') return 'new content';
        if (path === 'src/new.py' && ref === 'HEAD') return 'new file';
        throw new Error('Not found');
      });
      mockGit.getFileDiff.mockResolvedValue('');

      const result = await extractor.extractDiff('v1', 'HEAD');

      expect(result.fromRef).toBe('v1');
      expect(result.toRef).toBe('HEAD');
      expect(result.files).toHaveLength(2);
      expect(result.stats.filesChanged).toBe(2);
      expect(result.stats.additions).toBe(30);
      expect(result.stats.deletions).toBe(5);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should filter files based on exclude patterns', async () => {
      const changes: FileChange[] = [
        { path: 'src/index.ts', status: 'modified', additions: 10, deletions: 5 },
        { path: 'node_modules/pkg/index.js', status: 'added', additions: 100, deletions: 0 },
      ];

      mockGit.getChangedFiles.mockResolvedValue(changes);
      mockGit.getFileContent.mockResolvedValue('content');
      mockGit.getFileDiff.mockResolvedValue('');

      const result = await extractor.extractDiff('v1');

      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('src/index.ts');
    });

    it('should calculate correct stats', async () => {
      const changes: FileChange[] = [
        { path: 'added.ts', status: 'added', additions: 10, deletions: 0 },
        { path: 'modified.ts', status: 'modified', additions: 5, deletions: 3 },
        { path: 'deleted.ts', status: 'deleted', additions: 0, deletions: 20 },
        { path: 'renamed.ts', status: 'renamed', oldPath: 'old.ts', additions: 1, deletions: 1 },
      ];

      mockGit.getChangedFiles.mockResolvedValue(changes);
      mockGit.getFileContent.mockResolvedValue('content');
      mockGit.getFileDiff.mockResolvedValue('');

      const result = await extractor.extractDiff('v1');

      expect(result.stats).toEqual({
        filesChanged: 4,
        additions: 16,
        deletions: 24,
        filesAdded: 1,
        filesModified: 1,
        filesDeleted: 1,
        filesRenamed: 1,
      });
    });
  });

  describe('extractFileDiff', () => {
    it('should extract complete file diff information', async () => {
      const change: FileChange = {
        path: 'src/utils.ts',
        status: 'modified',
        additions: 5,
        deletions: 2,
      };

      mockGit.getFileContent.mockImplementation(async (path, ref) => {
        if (ref === 'v1') return 'old code';
        return 'new code';
      });

      const patch = `@@ -1,3 +1,5 @@
 line1
-old line
+new line
+added line
 line3`;
      mockGit.getFileDiff.mockResolvedValue(patch);

      const result = await extractor.extractFileDiff(change, 'v1', 'HEAD');

      expect(result.path).toBe('src/utils.ts');
      expect(result.status).toBe('modified');
      expect(result.language).toBe('typescript');
      expect(result.beforeContent).toBe('old code');
      expect(result.afterContent).toBe('new code');
      expect(result.additions).toBe(5);
      expect(result.deletions).toBe(2);
    });

    it('should handle added files', async () => {
      const change: FileChange = {
        path: 'src/new.ts',
        status: 'added',
        additions: 10,
        deletions: 0,
      };

      mockGit.getFileContent.mockImplementation(async (_, ref) => {
        if (ref === 'v1') throw new Error('Not found');
        return 'new content';
      });
      mockGit.getFileDiff.mockResolvedValue('@@ -0,0 +1,10 @@\n+new content');

      const result = await extractor.extractFileDiff(change, 'v1', 'HEAD');

      expect(result.beforeContent).toBeNull();
      expect(result.afterContent).toBe('new content');
    });

    it('should handle deleted files', async () => {
      const change: FileChange = {
        path: 'src/old.ts',
        status: 'deleted',
        additions: 0,
        deletions: 15,
      };

      mockGit.getFileContent.mockImplementation(async (_, ref) => {
        if (ref === 'HEAD') throw new Error('Not found');
        return 'deleted content';
      });
      mockGit.getFileDiff.mockResolvedValue('@@ -1,15 +0,0 @@\n-deleted content');

      const result = await extractor.extractFileDiff(change, 'v1', 'HEAD');

      expect(result.beforeContent).toBe('deleted content');
      expect(result.afterContent).toBeNull();
    });
  });

  describe('detectLanguage', () => {
    const testCases: [string, string][] = [
      ['file.ts', 'typescript'],
      ['file.tsx', 'typescript'],
      ['file.js', 'javascript'],
      ['file.jsx', 'javascript'],
      ['file.py', 'python'],
      ['file.rs', 'rust'],
      ['file.go', 'go'],
      ['file.java', 'java'],
      ['file.c', 'c'],
      ['file.cpp', 'cpp'],
      ['file.h', 'c'],
      ['file.hpp', 'cpp'],
      ['file.rb', 'ruby'],
      ['file.php', 'php'],
      ['file.json', 'json'],
      ['file.yaml', 'yaml'],
      ['file.yml', 'yaml'],
      ['file.md', 'markdown'],
      ['file.unknown', 'unknown'],
    ];

    it.each(testCases)('should detect %s as %s', (path, expected) => {
      const language = extractor.detectLanguage(path);
      expect(language).toBe(expected);
    });
  });

  describe('shouldProcessFile', () => {
    it('should exclude node_modules by default', () => {
      expect(extractor.shouldProcessFile('node_modules/pkg/index.js')).toBe(false);
    });

    it('should exclude .git directory by default', () => {
      expect(extractor.shouldProcessFile('.git/config')).toBe(false);
    });

    it('should include regular source files', () => {
      expect(extractor.shouldProcessFile('src/index.ts')).toBe(true);
      expect(extractor.shouldProcessFile('lib/utils.py')).toBe(true);
    });

    it('should respect custom include patterns', () => {
      const customExtractor = new DiffExtractor(mockGit as unknown as GitClient, {
        includePatterns: ['*.ts'],
      });

      expect(customExtractor.shouldProcessFile('src/index.ts')).toBe(true);
      expect(customExtractor.shouldProcessFile('src/index.js')).toBe(false);
    });

    it('should respect custom exclude patterns', () => {
      const customExtractor = new DiffExtractor(mockGit as unknown as GitClient, {
        excludePatterns: ['**/test/**', '**/node_modules/**'],
      });

      expect(customExtractor.shouldProcessFile('src/test/index.ts')).toBe(false);
      expect(customExtractor.shouldProcessFile('src/index.ts')).toBe(true);
    });
  });

  describe('getChangedFiles', () => {
    it('should return filtered changed files', async () => {
      const changes: FileChange[] = [
        { path: 'src/index.ts', status: 'modified', additions: 5, deletions: 2 },
        { path: 'node_modules/x/y.js', status: 'modified', additions: 1, deletions: 1 },
      ];

      mockGit.getChangedFiles.mockResolvedValue(changes);

      const result = await extractor.getChangedFiles('v1', 'v2');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.ts');
    });
  });

  describe('getFileVersions', () => {
    it('should return before and after content', async () => {
      mockGit.getFileContent.mockImplementation(async (_, ref) => {
        return ref === 'v1' ? 'before' : 'after';
      });

      const result = await extractor.getFileVersions('file.ts', 'v1', 'v2');

      expect(result.before).toBe('before');
      expect(result.after).toBe('after');
    });

    it('should handle missing files', async () => {
      mockGit.getFileContent.mockRejectedValue(new Error('Not found'));

      const result = await extractor.getFileVersions('file.ts', 'v1', 'v2');

      expect(result.before).toBeNull();
      expect(result.after).toBeNull();
    });
  });

  describe('hunk parsing', () => {
    it('should parse hunks correctly', async () => {
      const change: FileChange = {
        path: 'test.ts',
        status: 'modified',
        additions: 2,
        deletions: 1,
      };

      mockGit.getFileContent.mockResolvedValue('content');
      mockGit.getFileDiff.mockResolvedValue(`@@ -1,5 +1,6 @@
 context line
-deleted line
+added line 1
+added line 2
 more context`);

      const result = await extractor.extractFileDiff(change, 'v1', 'HEAD');

      expect(result.hunks).toHaveLength(1);
      expect(result.hunks[0].oldStart).toBe(1);
      expect(result.hunks[0].oldLines).toBe(5);
      expect(result.hunks[0].newStart).toBe(1);
      expect(result.hunks[0].newLines).toBe(6);

      expect(result.hunks[0].lines).toHaveLength(4);
      expect(result.hunks[0].lines[0].type).toBe('context');
      expect(result.hunks[0].lines[1].type).toBe('deletion');
      expect(result.hunks[0].lines[2].type).toBe('addition');
      expect(result.hunks[0].lines[3].type).toBe('addition');
    });

    it('should parse multiple hunks', async () => {
      const change: FileChange = {
        path: 'test.ts',
        status: 'modified',
        additions: 2,
        deletions: 2,
      };

      mockGit.getFileContent.mockResolvedValue('content');
      mockGit.getFileDiff.mockResolvedValue(`@@ -1,3 +1,3 @@
 line1
-old1
+new1
@@ -10,3 +10,3 @@
 line10
-old10
+new10`);

      const result = await extractor.extractFileDiff(change, 'v1', 'HEAD');

      expect(result.hunks).toHaveLength(2);
      expect(result.hunks[0].oldStart).toBe(1);
      expect(result.hunks[1].oldStart).toBe(10);
    });
  });
});
