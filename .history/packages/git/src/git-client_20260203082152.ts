/**
 * SED - Semantic Entropy Differencing
 * Git Client - Core Git Operations
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * Configuration options for GitClient
 */
export interface GitClientOptions {
  /** Timeout for git operations in milliseconds */
  timeout?: number;
  /** Maximum buffer size for stdout */
  maxBuffer?: number;
  /** Path to git binary */
  binary?: string;
  /** Base directory for relative paths */
  baseDir?: string;
}

/**
 * File change information
 */
export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
  additions: number;
  deletions: number;
}

/**
 * Log entry for a commit
 */
export interface LogEntry {
  hash: string;
  abbreviatedHash: string;
  author: string;
  authorEmail: string;
  date: Date;
  message: string;
  body: string;
  refs: string[];
}

/**
 * GitClient provides a clean interface for Git operations
 */
export class GitClient {
  private git: SimpleGit;
  private repoPath: string;
  private options: Required<GitClientOptions>;

  constructor(repoPath: string, options: GitClientOptions = {}) {
    this.repoPath = path.resolve(repoPath);
    this.options = {
      timeout: options.timeout ?? 30000,
      maxBuffer: options.maxBuffer ?? 50 * 1024 * 1024,
      binary: options.binary ?? 'git',
      baseDir: options.baseDir ?? this.repoPath,
    };

    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: this.repoPath,
      binary: this.options.binary,
      maxConcurrentProcesses: 6,
      trimmed: true,
    };

    this.git = simpleGit(gitOptions);
  }

  /**
   * Check if the path is a valid Git repository
   */
  async isRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * Get the root directory of the repository
   */
  async getRoot(): Promise<string> {
    const root = await this.git.revparse(['--show-toplevel']);
    return root.trim();
  }

  /**
   * Get the current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  }

  /**
   * Get the current commit hash
   */
  async getCurrentCommit(): Promise<string> {
    const hash = await this.git.revparse(['HEAD']);
    return hash.trim();
  }

  /**
   * Get abbreviated commit hash
   */
  async getAbbreviatedCommit(ref: string = 'HEAD'): Promise<string> {
    const hash = await this.git.revparse(['--short', ref]);
    return hash.trim();
  }

  /**
   * Get file content at a specific revision
   */
  async getFileContent(filePath: string, ref: string = 'HEAD'): Promise<string> {
    try {
      const content = await this.git.show([`${ref}:${filePath}`]);
      return content;
    } catch (error) {
      // File might not exist at this revision
      throw new Error(`Cannot get content of ${filePath} at ${ref}: ${error}`);
    }
  }

  /**
   * Check if a file exists at a specific revision
   */
  async fileExistsAt(filePath: string, ref: string = 'HEAD'): Promise<boolean> {
    try {
      await this.git.show([`${ref}:${filePath}`]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of changed files between two refs
   */
  async getChangedFiles(fromRef: string, toRef: string = 'HEAD'): Promise<FileChange[]> {
    const diff = await this.git.diff([
      '--name-status',
      '--numstat',
      fromRef,
      toRef,
    ]);

    return this.parseChangedFiles(diff, fromRef, toRef);
  }

  /**
   * Get diff between two refs
   */
  async getDiff(fromRef: string, toRef: string = 'HEAD', options: {
    unified?: number;
    paths?: string[];
  } = {}): Promise<string> {
    const args = [fromRef, toRef];
    
    if (options.unified !== undefined) {
      args.unshift(`-U${options.unified}`);
    }
    
    if (options.paths && options.paths.length > 0) {
      args.push('--', ...options.paths);
    }

    return await this.git.diff(args);
  }

  /**
   * Get diff for a specific file between two refs
   */
  async getFileDiff(
    filePath: string,
    fromRef: string,
    toRef: string = 'HEAD'
  ): Promise<string> {
    return await this.git.diff([fromRef, toRef, '--', filePath]);
  }

  /**
   * Get commit log
   */
  async getLog(options: {
    maxCount?: number;
    from?: string;
    to?: string;
  } = {}): Promise<LogEntry[]> {
    const logOptions: string[] = [
      '--format=%H|%h|%an|%ae|%aI|%s|%b|%D',
    ];

    if (options.maxCount) {
      logOptions.push(`-n${options.maxCount}`);
    }

    if (options.from && options.to) {
      logOptions.push(`${options.from}..${options.to}`);
    } else if (options.from) {
      logOptions.push(options.from);
    }

    const log = await this.git.log(logOptions as any);
    
    // Parse custom format
    return this.parseLogOutput(await this.git.raw(['log', ...logOptions]));
  }

  /**
   * Get all branches
   */
  async getBranches(): Promise<{ current: string; all: string[] }> {
    const branchSummary = await this.git.branch(['-a']);
    return {
      current: branchSummary.current,
      all: branchSummary.all,
    };
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<string[]> {
    const tags = await this.git.tags();
    return tags.all;
  }

  /**
   * Get the merge base between two refs
   */
  async getMergeBase(ref1: string, ref2: string): Promise<string> {
    const base = await this.git.raw(['merge-base', ref1, ref2]);
    return base.trim();
  }

  /**
   * Check if working directory is clean
   */
  async isClean(): Promise<boolean> {
    const status = await this.git.status();
    return status.isClean();
  }

  /**
   * Get working directory status
   */
  async getStatus(): Promise<{
    staged: string[];
    modified: string[];
    untracked: string[];
    isClean: boolean;
  }> {
    const status = await this.git.status();
    return {
      staged: status.staged,
      modified: status.modified,
      untracked: status.not_added,
      isClean: status.isClean(),
    };
  }

  /**
   * Get the underlying simple-git instance for advanced operations
   */
  getRawGit(): SimpleGit {
    return this.git;
  }

  /**
   * Get repository path
   */
  getRepoPath(): string {
    return this.repoPath;
  }

  // Private helper methods

  private async parseChangedFiles(
    diff: string,
    _fromRef: string,
    _toRef: string
  ): Promise<FileChange[]> {
    const result = await this.git.diffSummary([_fromRef, _toRef]);
    
    return result.files.map((file) => ({
      path: file.file,
      status: this.parseFileStatus(file),
      additions: file.insertions,
      deletions: file.deletions,
    }));
  }

  private parseFileStatus(file: { file: string; insertions: number; deletions: number }): FileChange['status'] {
    if (file.insertions > 0 && file.deletions === 0) {
      return 'added';
    } else if (file.insertions === 0 && file.deletions > 0) {
      return 'deleted';
    }
    return 'modified';
  }

  private parseLogOutput(output: string): LogEntry[] {
    const entries: LogEntry[] = [];
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('|');
      if (parts.length < 6) continue;
      
      entries.push({
        hash: parts[0],
        abbreviatedHash: parts[1],
        author: parts[2],
        authorEmail: parts[3],
        date: new Date(parts[4]),
        message: parts[5],
        body: parts[6] || '',
        refs: parts[7] ? parts[7].split(',').map((r) => r.trim()) : [],
      });
    }
    
    return entries;
  }
}
