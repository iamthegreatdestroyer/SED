# @sed/git

Git integration utilities for SED.

## Overview

`@sed/git` provides Git operations for:

- Fetching diffs
- Parsing commits
- Working with branches
- Repository management

## Installation

```bash
npm install @sed/git
```

## Quick Start

```typescript
import { getDiff, getChangedFiles, GitClient } from '@sed/git';

// Get diff between commits
const diff = await getDiff('HEAD~1', 'HEAD');

// Get list of changed files
const files = await getChangedFiles('main', 'feature-branch');
```

## Core Functions

### getDiff

Get diff content between two references.

```typescript
import { getDiff } from '@sed/git';

const diff = await getDiff('abc123', 'def456', {
  path: 'src/',
  contextLines: 3,
});
```

### getChangedFiles

Get list of changed files.

```typescript
import { getChangedFiles } from '@sed/git';

const files = await getChangedFiles('main', 'HEAD', {
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts'],
});

for (const file of files) {
  console.log(file.path, file.status);
}
```

### parseCommit

Parse commit information.

```typescript
import { parseCommit } from '@sed/git';

const commit = await parseCommit('abc123');

console.log(commit.hash);
console.log(commit.message);
console.log(commit.author);
console.log(commit.date);
```

### getFileContent

Get file content at a specific commit.

```typescript
import { getFileContent } from '@sed/git';

const content = await getFileContent('src/index.ts', 'HEAD~1');
```

## Classes

### GitClient

Full-featured Git client.

```typescript
import { GitClient } from '@sed/git';

const git = new GitClient('/path/to/repo');

const branches = await git.getBranches();
const commits = await git.log({ limit: 10 });
const status = await git.status();
```

## Types

### ChangedFile

```typescript
interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
  additions: number;
  deletions: number;
}
```

### Commit

```typescript
interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: Author;
  date: Date;
  parents: string[];
}
```

## Error Handling

```typescript
import { getDiff, GitError, NotARepositoryError } from '@sed/git';

try {
  const diff = await getDiff('main', 'feature');
} catch (error) {
  if (error instanceof NotARepositoryError) {
    console.error('Not in a git repository');
  } else if (error instanceof GitError) {
    console.error('Git error:', error.message);
  }
}
```

## Requirements

- Git must be installed and in PATH
- Repository must be initialized

## See Also

- [API Reference](/api/git)
- [@sed/core](/packages/core/)
