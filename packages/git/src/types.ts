/**
 * Git Integration Types
 *
 * Core type definitions for Git operations, diffs, commits, and repository analysis.
 */

/**
 * Represents a Git commit with metadata and changes
 */
export interface GitCommit {
  /** Full commit SHA-1 hash */
  hash: string;
  /** Abbreviated commit hash (7 characters) */
  shortHash: string;
  /** Commit author information */
  author: {
    name: string;
    email: string;
    date: Date;
  };
  /** Commit committer information (may differ from author) */
  committer: {
    name: string;
    email: string;
    date: Date;
  };
  /** Commit message subject (first line) */
  subject: string;
  /** Full commit message body */
  body: string;
  /** Parent commit hashes */
  parents: string[];
  /** Files changed in this commit */
  files: GitFileChange[];
  /** Commit statistics */
  stats: {
    insertions: number;
    deletions: number;
    filesChanged: number;
  };
}

/**
 * Represents a file change in a Git diff
 */
export interface GitFileChange {
  /** Path to the file before change (for renames) */
  oldPath: string | null;
  /** Path to the file after change */
  newPath: string;
  /** Type of change */
  changeType: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  /** Number of insertions */
  insertions: number;
  /** Number of deletions */
  deletions: number;
  /** Hunks containing the actual changes */
  hunks: GitDiffHunk[];
  /** Whether the file is binary */
  isBinary: boolean;
  /** File mode changes (e.g., permission changes) */
  mode?: {
    old: string;
    new: string;
  };
}

/**
 * Represents a hunk (contiguous block of changes) in a diff
 */
export interface GitDiffHunk {
  /** Hunk header (e.g., "@@ -10,7 +10,8 @@") */
  header: string;
  /** Old file start line */
  oldStart: number;
  /** Old file line count */
  oldLines: number;
  /** New file start line */
  newStart: number;
  /** New file line count */
  newLines: number;
  /** Lines in this hunk */
  lines: GitDiffLine[];
}

/**
 * Represents a single line in a diff
 */
export interface GitDiffLine {
  /** Line type: added (+), deleted (-), or context ( ) */
  type: 'addition' | 'deletion' | 'context';
  /** Line content without the leading +/- marker */
  content: string;
  /** Old file line number (null for additions) */
  oldLineNumber: number | null;
  /** New file line number (null for deletions) */
  newLineNumber: number | null;
}

/**
 * Represents a Git branch
 */
export interface GitBranch {
  /** Branch name */
  name: string;
  /** Full reference name (e.g., refs/heads/main) */
  ref: string;
  /** Current HEAD commit */
  commit: string;
  /** Whether this is the current branch */
  current: boolean;
  /** Whether this is a remote tracking branch */
  remote: boolean;
  /** Upstream branch if tracking */
  upstream?: string;
}

/**
 * Represents a Git tag
 */
export interface GitTag {
  /** Tag name */
  name: string;
  /** Commit the tag points to */
  commit: string;
  /** Annotated tag message (if any) */
  message?: string;
  /** Tagger information (for annotated tags) */
  tagger?: {
    name: string;
    email: string;
    date: Date;
  };
}

/**
 * Repository status information
 */
export interface GitStatus {
  /** Current branch name */
  branch: string | null;
  /** Current commit hash */
  commit: string | null;
  /** Whether there are uncommitted changes */
  dirty: boolean;
  /** Staged files */
  staged: string[];
  /** Modified files */
  modified: string[];
  /** Untracked files */
  untracked: string[];
  /** Deleted files */
  deleted: string[];
  /** Files with conflicts */
  conflicted: string[];
  /** Commits ahead of upstream */
  ahead: number;
  /** Commits behind upstream */
  behind: number;
}

/**
 * Options for Git operations
 */
export interface GitOptions {
  /** Working directory (repository root) */
  cwd: string;
  /** Maximum buffer size for command output (default: 10MB) */
  maxBuffer?: number;
  /** Command timeout in milliseconds (default: 30s) */
  timeout?: number;
}

/**
 * Options for log retrieval
 */
export interface GitLogOptions extends GitOptions {
  /** Maximum number of commits to retrieve */
  maxCount?: number;
  /** Skip the first N commits */
  skip?: number;
  /** Start from this commit */
  since?: string | Date;
  /** End at this commit */
  until?: string | Date;
  /** Filter by author */
  author?: string;
  /** Filter by committer */
  committer?: string;
  /** Filter commits affecting these paths */
  paths?: string[];
  /** Include merge commits */
  merges?: boolean;
  /** Specific branch or ref */
  ref?: string;
}

/**
 * Options for diff extraction
 */
export interface GitDiffOptions extends GitOptions {
  /** Include context lines around changes */
  context?: number;
  /** Ignore whitespace changes */
  ignoreWhitespace?: boolean;
  /** Ignore whitespace at end of lines */
  ignoreWhitespaceAtEol?: boolean;
  /** Filter by file paths */
  paths?: string[];
  /** Generate diff between two commits/refs */
  from?: string;
  to?: string;
  /** Include binary file diffs */
  binary?: boolean;
}

/**
 * Repository analysis result
 */
export interface RepoAnalysis {
  /** Repository root path */
  root: string;
  /** Total number of commits */
  totalCommits: number;
  /** Number of branches */
  branches: number;
  /** Number of tags */
  tags: number;
  /** Number of contributors */
  contributors: number;
  /** Repository age (first to last commit) */
  age: {
    firstCommit: Date;
    lastCommit: Date;
    days: number;
  };
  /** Overall statistics */
  stats: {
    totalInsertions: number;
    totalDeletions: number;
    filesChanged: number;
  };
  /** Top contributors by commit count */
  topContributors: Array<{
    name: string;
    email: string;
    commits: number;
    insertions: number;
    deletions: number;
  }>;
  /** Most active files by change frequency */
  activeFiles: Array<{
    path: string;
    changes: number;
    insertions: number;
    deletions: number;
  }>;
  /** Language distribution */
  languages: Record<string, number>;
}

/**
 * Error thrown by Git operations
 */
export class GitError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(message);
    this.name = 'GitError';
  }
}
