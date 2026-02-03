/**
 * SED - Semantic Entropy Differencing
 * Git Test Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { vi } from 'vitest';
import type { FileChange, LogEntry } from '../src/git-client.js';
import type { FileDiff, DiffHunk, DiffLine } from '../src/diff-extractor.js';
import type { ParsedCommit, ConventionalCommit } from '../src/commit-parser.js';

/**
 * Create a mock file change
 */
export function createFileChange(overrides: Partial<FileChange> = {}): FileChange {
  return {
    path: 'src/file.ts',
    status: 'modified',
    additions: 10,
    deletions: 5,
    ...overrides,
  };
}

/**
 * Create a mock log entry
 */
export function createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    hash: 'abc123def456789',
    abbreviatedHash: 'abc123d',
    author: 'Test Author',
    authorEmail: 'test@example.com',
    date: new Date('2024-01-15T10:00:00Z'),
    message: 'feat: test commit',
    body: '',
    refs: [],
    ...overrides,
  };
}

/**
 * Create a mock diff line
 */
export function createDiffLine(overrides: Partial<DiffLine> = {}): DiffLine {
  return {
    type: 'context',
    content: 'line content',
    oldLineNumber: 1,
    newLineNumber: 1,
    ...overrides,
  };
}

/**
 * Create a mock diff hunk
 */
export function createDiffHunk(overrides: Partial<DiffHunk> = {}): DiffHunk {
  return {
    oldStart: 1,
    oldLines: 5,
    newStart: 1,
    newLines: 7,
    header: '@@ -1,5 +1,7 @@',
    lines: [
      createDiffLine({ type: 'context', content: 'context' }),
      createDiffLine({ type: 'deletion', content: 'old line', newLineNumber: undefined }),
      createDiffLine({ type: 'addition', content: 'new line', oldLineNumber: undefined }),
    ],
    ...overrides,
  };
}

/**
 * Create a mock file diff
 */
export function createFileDiff(overrides: Partial<FileDiff> = {}): FileDiff {
  return {
    path: 'src/file.ts',
    status: 'modified',
    language: 'typescript',
    beforeContent: 'old content',
    afterContent: 'new content',
    patch: '@@ -1,5 +1,7 @@\n context\n-old\n+new',
    additions: 5,
    deletions: 3,
    hunks: [createDiffHunk()],
    ...overrides,
  };
}

/**
 * Create a mock conventional commit
 */
export function createConventionalCommit(overrides: Partial<ConventionalCommit> = {}): ConventionalCommit {
  return {
    type: 'feat',
    scope: 'core',
    description: 'add new feature',
    breaking: false,
    ...overrides,
  };
}

/**
 * Create a mock parsed commit
 */
export function createParsedCommit(overrides: Partial<ParsedCommit> = {}): ParsedCommit {
  return {
    hash: 'abc123def456789',
    abbreviatedHash: 'abc123d',
    author: {
      name: 'Test Author',
      email: 'test@example.com',
    },
    date: new Date('2024-01-15T10:00:00Z'),
    message: 'feat(core): add new feature',
    subject: 'feat(core): add new feature',
    body: '',
    refs: [],
    isConventional: true,
    conventional: createConventionalCommit(),
    ...overrides,
  };
}

/**
 * Create a mock GitClient
 */
export function createMockGitClient() {
  return {
    isRepo: vi.fn().mockResolvedValue(true),
    getRoot: vi.fn().mockResolvedValue('/test/repo'),
    getCurrentBranch: vi.fn().mockResolvedValue('main'),
    getCurrentCommit: vi.fn().mockResolvedValue('abc123'),
    getAbbreviatedCommit: vi.fn().mockResolvedValue('abc'),
    getFileContent: vi.fn().mockResolvedValue('file content'),
    fileExistsAt: vi.fn().mockResolvedValue(true),
    getChangedFiles: vi.fn().mockResolvedValue([]),
    getDiff: vi.fn().mockResolvedValue('diff output'),
    getFileDiff: vi.fn().mockResolvedValue('file diff'),
    getLog: vi.fn().mockResolvedValue([]),
    getBranches: vi.fn().mockResolvedValue({ current: 'main', all: ['main'] }),
    getTags: vi.fn().mockResolvedValue([]),
    getMergeBase: vi.fn().mockResolvedValue('abc123'),
    isClean: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockResolvedValue({
      staged: [],
      modified: [],
      untracked: [],
      isClean: true,
    }),
    getRawGit: vi.fn().mockReturnValue({
      raw: vi.fn().mockResolvedValue(''),
      getRemotes: vi.fn().mockResolvedValue([]),
    }),
    getRepoPath: vi.fn().mockReturnValue('/test/repo'),
  };
}

/**
 * Create sample TypeScript file content
 */
export function createTypeScriptSample(): string {
  return `/**
 * Sample TypeScript file for testing
 */

interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}
`;
}

/**
 * Create sample Python file content
 */
export function createPythonSample(): string {
  return `"""
Sample Python file for testing
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class User:
    id: int
    name: str
    email: str

class UserService:
    def __init__(self):
        self._users: List[User] = []
    
    def add_user(self, user: User) -> None:
        self._users.append(user)
    
    def get_user(self, user_id: int) -> Optional[User]:
        return next((u for u in self._users if u.id == user_id), None)
    
    def get_all_users(self) -> List[User]:
        return list(self._users)
`;
}

/**
 * Create sample diff output
 */
export function createSampleDiff(): string {
  return `diff --git a/src/file.ts b/src/file.ts
index abc123..def456 100644
--- a/src/file.ts
+++ b/src/file.ts
@@ -1,5 +1,7 @@
 import { something } from './something';
 
-const oldValue = 1;
+const newValue = 2;
+const anotherValue = 3;
 
 export function test() {
   return oldValue;
@@ -10,3 +12,5 @@ export function test() {
 }
 
 export const constant = 'value';
+
+export const newConstant = 'new';
`;
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random commit hash
 */
export function randomHash(): string {
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate abbreviated hash from full hash
 */
export function abbreviateHash(hash: string): string {
  return hash.substring(0, 7);
}

/**
 * Create commit list for testing
 */
export function createCommitList(count: number): LogEntry[] {
  const types = ['feat', 'fix', 'docs', 'refactor', 'test'];
  const scopes = ['core', 'api', 'ui', 'cli', undefined];

  return Array.from({ length: count }, (_, i) => {
    const hash = randomHash();
    const type = types[i % types.length];
    const scope = scopes[i % scopes.length];
    const scopePart = scope ? `(${scope})` : '';

    return createLogEntry({
      hash,
      abbreviatedHash: abbreviateHash(hash),
      message: `${type}${scopePart}: commit message ${i + 1}`,
      date: new Date(Date.now() - i * 86400000), // Each commit 1 day apart
    });
  });
}
