/**
 * SED - Semantic Entropy Differencing
 * Diff Extractor - Extract and Process Git Diffs
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { GitClient, FileChange } from './git-client.js';

/**
 * Options for diff extraction
 */
export interface DiffExtractorOptions {
  /** Number of context lines in diff */
  contextLines?: number;
  /** Include binary files */
  includeBinary?: boolean;
  /** File patterns to include */
  includePatterns?: string[];
  /** File patterns to exclude */
  excludePatterns?: string[];
  /** Maximum file size to process (bytes) */
  maxFileSize?: number;
}

/**
 * Represents a single file diff
 */
export interface FileDiff {
  path: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  language: string;
  beforeContent: string | null;
  afterContent: string | null;
  patch: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

/**
 * Represents a hunk in a diff
 */
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

/**
 * Represents a single line in a diff
 */
export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Complete extracted diff result
 */
export interface ExtractedDiff {
  fromRef: string;
  toRef: string;
  files: FileDiff[];
  stats: {
    filesChanged: number;
    additions: number;
    deletions: number;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    filesRenamed: number;
  };
  timestamp: Date;
}

// Language detection mapping
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.lua': 'lua',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.sql': 'sql',
  '.md': 'markdown',
  '.mdx': 'markdown',
};

/**
 * DiffExtractor handles extraction and processing of Git diffs
 */
export class DiffExtractor {
  private git: GitClient;
  private options: Required<DiffExtractorOptions>;

  constructor(git: GitClient, options: DiffExtractorOptions = {}) {
    this.git = git;
    this.options = {
      contextLines: options.contextLines ?? 3,
      includeBinary: options.includeBinary ?? false,
      includePatterns: options.includePatterns ?? [],
      excludePatterns: options.excludePatterns ?? ['**/node_modules/**', '**/.git/**'],
      maxFileSize: options.maxFileSize ?? 1024 * 1024, // 1MB default
    };
  }

  /**
   * Extract complete diff between two refs
   */
  async extractDiff(fromRef: string, toRef: string = 'HEAD'): Promise<ExtractedDiff> {
    const changedFiles = await this.git.getChangedFiles(fromRef, toRef);
    const filteredFiles = this.filterFiles(changedFiles);

    const files: FileDiff[] = [];

    for (const change of filteredFiles) {
      try {
        const fileDiff = await this.extractFileDiff(change, fromRef, toRef);
        files.push(fileDiff);
      } catch (error) {
        // Skip files that can't be processed
        console.warn(`Skipping file ${change.path}: ${error}`);
      }
    }

    return {
      fromRef,
      toRef,
      files,
      stats: this.calculateStats(files),
      timestamp: new Date(),
    };
  }

  /**
   * Extract diff for a single file
   */
  async extractFileDiff(change: FileChange, fromRef: string, toRef: string): Promise<FileDiff> {
    const language = this.detectLanguage(change.path);

    // Get content before and after
    let beforeContent: string | null = null;
    let afterContent: string | null = null;

    if (change.status !== 'added') {
      try {
        beforeContent = await this.git.getFileContent(change.oldPath || change.path, fromRef);
      } catch {
        // File didn't exist before
      }
    }

    if (change.status !== 'deleted') {
      try {
        afterContent = await this.git.getFileContent(change.path, toRef);
      } catch {
        // File doesn't exist now
      }
    }

    // Get patch
    const patch = await this.git.getFileDiff(change.path, fromRef, toRef);
    const hunks = this.parseHunks(patch);

    return {
      path: change.path,
      oldPath: change.oldPath,
      status: change.status,
      language,
      beforeContent,
      afterContent,
      patch,
      additions: change.additions,
      deletions: change.deletions,
      hunks,
    };
  }

  /**
   * Get list of changed files with metadata
   */
  async getChangedFiles(fromRef: string, toRef: string = 'HEAD'): Promise<FileChange[]> {
    const changes = await this.git.getChangedFiles(fromRef, toRef);
    return this.filterFiles(changes);
  }

  /**
   * Get file content at specific refs for comparison
   */
  async getFileVersions(
    filePath: string,
    fromRef: string,
    toRef: string = 'HEAD'
  ): Promise<{ before: string | null; after: string | null }> {
    let before: string | null = null;
    let after: string | null = null;

    try {
      before = await this.git.getFileContent(filePath, fromRef);
    } catch {
      // File didn't exist at fromRef
    }

    try {
      after = await this.git.getFileContent(filePath, toRef);
    } catch {
      // File doesn't exist at toRef
    }

    return { before, after };
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return LANGUAGE_MAP[ext] || 'unknown';
  }

  /**
   * Check if file should be processed
   */
  shouldProcessFile(filePath: string): boolean {
    // Check exclude patterns
    for (const pattern of this.options.excludePatterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check include patterns if specified
    if (this.options.includePatterns.length > 0) {
      for (const pattern of this.options.includePatterns) {
        if (this.matchesPattern(filePath, pattern)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  // Private helper methods

  private filterFiles(files: FileChange[]): FileChange[] {
    return files.filter((file) => this.shouldProcessFile(file.path));
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob matching
    const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private parseHunks(patch: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const lines = patch.split('\n');

    let currentHunk: DiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      // Match hunk header: @@ -1,5 +1,7 @@
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);

      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        oldLine = parseInt(hunkMatch[1], 10);
        newLine = parseInt(hunkMatch[3], 10);

        currentHunk = {
          oldStart: oldLine,
          oldLines: parseInt(hunkMatch[2] || '1', 10),
          newStart: newLine,
          newLines: parseInt(hunkMatch[4] || '1', 10),
          header: line,
          lines: [],
        };
        continue;
      }

      if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'addition',
            content: line.slice(1),
            newLineNumber: newLine++,
          });
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'deletion',
            content: line.slice(1),
            oldLineNumber: oldLine++,
          });
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({
            type: 'context',
            content: line.slice(1),
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
          });
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  private calculateStats(files: FileDiff[]): ExtractedDiff['stats'] {
    return {
      filesChanged: files.length,
      additions: files.reduce((sum, f) => sum + f.additions, 0),
      deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      filesAdded: files.filter((f) => f.status === 'added').length,
      filesModified: files.filter((f) => f.status === 'modified').length,
      filesDeleted: files.filter((f) => f.status === 'deleted').length,
      filesRenamed: files.filter((f) => f.status === 'renamed').length,
    };
  }
}
