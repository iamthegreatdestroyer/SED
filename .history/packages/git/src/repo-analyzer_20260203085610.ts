/**
 * SED - Semantic Entropy Differencing
 * Repository Analyzer - Analyze Git Repository Structure
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { GitClient } from './git-client.js';

/**
 * Repository information
 */
export interface RepoInfo {
  root: string;
  isValid: boolean;
  currentBranch: string;
  currentCommit: string;
  isClean: boolean;
  branches: BranchInfo[];
  tags: TagInfo[];
  remotes: RemoteInfo[];
  stats: RepoStats;
}

/**
 * Branch information
 */
export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  upstream?: string;
  lastCommit?: string;
}

/**
 * Tag information
 */
export interface TagInfo {
  name: string;
  commit: string;
  isAnnotated: boolean;
  message?: string;
  date?: Date;
}

/**
 * Remote information
 */
export interface RemoteInfo {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

/**
 * Repository statistics
 */
export interface RepoStats {
  totalCommits: number;
  totalBranches: number;
  totalTags: number;
  contributors: number;
  filesTracked: number;
}

/**
 * File tree entry
 */
export interface FileTreeEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  language?: string;
  size?: number;
  children?: FileTreeEntry[];
}

/**
 * RepoAnalyzer provides repository analysis utilities
 */
export class RepoAnalyzer {
  private git: GitClient;

  constructor(git: GitClient) {
    this.git = git;
  }

  /**
   * Get comprehensive repository information
   */
  async analyze(): Promise<RepoInfo> {
    const isValid = await this.git.isRepo();

    if (!isValid) {
      return {
        root: this.git.getRepoPath(),
        isValid: false,
        currentBranch: '',
        currentCommit: '',
        isClean: false,
        branches: [],
        tags: [],
        remotes: [],
        stats: {
          totalCommits: 0,
          totalBranches: 0,
          totalTags: 0,
          contributors: 0,
          filesTracked: 0,
        },
      };
    }

    const [root, currentBranch, currentCommit, isClean, branches, tags, remotes, stats] =
      await Promise.all([
        this.git.getRoot(),
        this.git.getCurrentBranch(),
        this.git.getCurrentCommit(),
        this.git.isClean(),
        this.getBranches(),
        this.getTags(),
        this.getRemotes(),
        this.getStats(),
      ]);

    return {
      root,
      isValid,
      currentBranch,
      currentCommit,
      isClean,
      branches,
      tags,
      remotes,
      stats,
    };
  }

  /**
   * Get all branches with metadata
   */
  async getBranches(): Promise<BranchInfo[]> {
    const { current, all } = await this.git.getBranches();

    return all.map((name) => ({
      name: name.replace(/^remotes\//, ''),
      isCurrent: name === current,
      isRemote: name.startsWith('remotes/'),
    }));
  }

  /**
   * Get all tags with metadata
   */
  async getTags(): Promise<TagInfo[]> {
    const tagNames = await this.git.getTags();

    // For performance, return basic tag info
    // Detailed info can be fetched on demand
    return tagNames.map((name) => ({
      name,
      commit: '', // Would need additional git call
      isAnnotated: false, // Would need additional git call
    }));
  }

  /**
   * Get remote information
   */
  async getRemotes(): Promise<RemoteInfo[]> {
    const rawGit = this.git.getRawGit();
    const remotes = await rawGit.getRemotes(true);

    return remotes.map((remote) => ({
      name: remote.name,
      fetchUrl: remote.refs.fetch || '',
      pushUrl: remote.refs.push || '',
    }));
  }

  /**
   * Get repository statistics
   */
  async getStats(): Promise<RepoStats> {
    const rawGit = this.git.getRawGit();

    try {
      // Get commit count
      const commitCount = await rawGit.raw(['rev-list', '--count', 'HEAD']);

      // Get branch count
      const { all } = await this.git.getBranches();

      // Get tag count
      const tags = await this.git.getTags();

      // Get contributor count (approximate)
      const contributors = await rawGit.raw(['shortlog', '-sn', '--all']);
      const contributorCount = contributors.trim().split('\n').filter(Boolean).length;

      // Get tracked files count
      const files = await rawGit.raw(['ls-files']);
      const fileCount = files.trim().split('\n').filter(Boolean).length;

      return {
        totalCommits: parseInt(commitCount.trim(), 10) || 0,
        totalBranches: all.filter((b) => !b.startsWith('remotes/')).length,
        totalTags: tags.length,
        contributors: contributorCount,
        filesTracked: fileCount,
      };
    } catch {
      return {
        totalCommits: 0,
        totalBranches: 0,
        totalTags: 0,
        contributors: 0,
        filesTracked: 0,
      };
    }
  }

  /**
   * Get file tree at a specific ref
   */
  async getFileTree(ref: string = 'HEAD', path: string = ''): Promise<FileTreeEntry[]> {
    const rawGit = this.git.getRawGit();

    try {
      const args = ['ls-tree', '-r', '--name-only', ref];
      if (path) {
        args.push('--', path);
      }

      const output = await rawGit.raw(args);
      const files = output.trim().split('\n').filter(Boolean);

      return files.map((filePath) => ({
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        type: 'file' as const,
        language: this.detectLanguage(filePath),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get files changed since a ref
   */
  async getChangedFilesSince(ref: string): Promise<string[]> {
    const changes = await this.git.getChangedFiles(ref, 'HEAD');
    return changes.map((c) => c.path);
  }

  /**
   * Find merge base between current branch and another
   */
  async findMergeBase(branch: string): Promise<string> {
    const currentBranch = await this.git.getCurrentBranch();
    return this.git.getMergeBase(currentBranch, branch);
  }

  /**
   * Get blame information for a file
   */
  async getBlame(filePath: string): Promise<BlameInfo[]> {
    const rawGit = this.git.getRawGit();

    try {
      const output = await rawGit.raw(['blame', '--line-porcelain', filePath]);

      return this.parseBlame(output);
    } catch {
      return [];
    }
  }

  /**
   * Check if a file exists at ref
   */
  async fileExists(filePath: string, ref: string = 'HEAD'): Promise<boolean> {
    return this.git.fileExistsAt(filePath, ref);
  }

  /**
   * Get last modification info for a file
   */
  async getLastModification(filePath: string): Promise<{
    commit: string;
    author: string;
    date: Date;
    message: string;
  } | null> {
    const rawGit = this.git.getRawGit();

    try {
      const output = await rawGit.raw(['log', '-1', '--format=%H|%an|%aI|%s', '--', filePath]);

      if (!output.trim()) {
        return null;
      }

      const [commit, author, date, message] = output.trim().split('|');
      return {
        commit,
        author,
        date: new Date(date),
        message,
      };
    } catch {
      return null;
    }
  }

  // Private helper methods

  private detectLanguage(filePath: string): string | undefined {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
    };
    return languageMap[ext];
  }

  private parseBlame(output: string): BlameInfo[] {
    const lines = output.split('\n');
    const results: BlameInfo[] = [];

    let currentEntry: Partial<BlameInfo> = {};
    let lineNumber = 0;

    for (const line of lines) {
      if (line.match(/^[a-f0-9]{40}/)) {
        const parts = line.split(' ');
        currentEntry.commit = parts[0];
        lineNumber = parseInt(parts[2], 10);
      } else if (line.startsWith('author ')) {
        currentEntry.author = line.substring(7);
      } else if (line.startsWith('author-time ')) {
        currentEntry.date = new Date(parseInt(line.substring(12), 10) * 1000);
      } else if (line.startsWith('\t')) {
        currentEntry.line = lineNumber;
        currentEntry.content = line.substring(1);

        if (currentEntry.commit && currentEntry.author) {
          results.push(currentEntry as BlameInfo);
        }
        currentEntry = {};
      }
    }

    return results;
  }
}

/**
 * Blame information for a line
 */
export interface BlameInfo {
  line: number;
  commit: string;
  author: string;
  date: Date;
  content: string;
}
