# @sed/git API

The git package provides integration with Git for diff extraction and commit analysis.

## Installation

```bash
npm install @sed/git
```

## Functions

### getDiff

Get the diff between two commits.

```typescript
function getDiff(options: GetDiffOptions): Promise<GitDiff>;
```

**Parameters:**

| Name      | Type             | Description  |
| --------- | ---------------- | ------------ |
| `options` | `GetDiffOptions` | Diff options |

**Returns:** `Promise<GitDiff>`

**Example:**

```typescript
import { getDiff } from '@sed/git';

const diff = await getDiff({
  from: 'HEAD~1',
  to: 'HEAD',
  cwd: process.cwd(),
});

console.log(diff.files.length); // Number of changed files
```

### getChangedFiles

Get list of files changed between commits.

```typescript
function getChangedFiles(options: GetDiffOptions): Promise<FileChange[]>;
```

**Parameters:**

| Name      | Type             | Description  |
| --------- | ---------------- | ------------ |
| `options` | `GetDiffOptions` | Diff options |

**Returns:** `Promise<FileChange[]>`

**Example:**

```typescript
import { getChangedFiles } from '@sed/git';

const files = await getChangedFiles({
  from: 'main',
  to: 'feature-branch',
});

for (const file of files) {
  console.log(`${file.status}: ${file.path}`);
}
```

### parseCommit

Parse commit information.

```typescript
function parseCommit(ref: string, options?: ParseCommitOptions): Promise<CommitInfo>;
```

**Parameters:**

| Name      | Type                 | Description      |
| --------- | -------------------- | ---------------- |
| `ref`     | `string`             | Commit reference |
| `options` | `ParseCommitOptions` | Parse options    |

**Returns:** `Promise<CommitInfo>`

**Example:**

```typescript
import { parseCommit } from '@sed/git';

const commit = await parseCommit('HEAD');

console.log(commit.hash); // 'abc123...'
console.log(commit.message); // 'feat: add feature'
console.log(commit.author); // { name: 'John', email: 'john@example.com' }
```

### getFileContent

Get file content at a specific commit.

```typescript
function getFileContent(
  path: string,
  ref: string,
  options?: GetFileOptions
): Promise<string | null>;
```

**Parameters:**

| Name      | Type             | Description      |
| --------- | ---------------- | ---------------- |
| `path`    | `string`         | File path        |
| `ref`     | `string`         | Commit reference |
| `options` | `GetFileOptions` | Options          |

**Returns:** `Promise<string | null>`

**Example:**

```typescript
import { getFileContent } from '@sed/git';

const content = await getFileContent('src/index.ts', 'HEAD~1');
```

### getRepository

Get repository information.

```typescript
function getRepository(cwd?: string): Promise<RepositoryInfo>;
```

**Parameters:**

| Name  | Type     | Description       |
| ----- | -------- | ----------------- |
| `cwd` | `string` | Working directory |

**Returns:** `Promise<RepositoryInfo>`

**Example:**

```typescript
import { getRepository } from '@sed/git';

const repo = await getRepository();

console.log(repo.root); // '/path/to/repo'
console.log(repo.branch); // 'main'
console.log(repo.remote); // 'origin'
console.log(repo.url); // 'https://github.com/...'
```

### getBranches

Get list of branches.

```typescript
function getBranches(options?: GetBranchesOptions): Promise<BranchInfo[]>;
```

**Example:**

```typescript
import { getBranches } from '@sed/git';

const branches = await getBranches();

for (const branch of branches) {
  console.log(`${branch.name} (${branch.current ? 'current' : 'other'})`);
}
```

### getTags

Get list of tags.

```typescript
function getTags(options?: GetTagsOptions): Promise<TagInfo[]>;
```

**Example:**

```typescript
import { getTags } from '@sed/git';

const tags = await getTags();

for (const tag of tags) {
  console.log(`${tag.name}: ${tag.commit}`);
}
```

## Classes

### GitClient

Low-level Git client for advanced operations.

```typescript
class GitClient {
  constructor(options?: GitClientOptions);

  exec(command: string, args: string[]): Promise<string>;
  diff(from: string, to: string): Promise<GitDiff>;
  log(options?: LogOptions): Promise<CommitInfo[]>;
  status(): Promise<StatusResult>;
  show(ref: string, path?: string): Promise<string>;
}
```

**Example:**

```typescript
import { GitClient } from '@sed/git';

const git = new GitClient({ cwd: '/path/to/repo' });

const status = await git.status();
const log = await git.log({ limit: 10 });
```

## Types

### GetDiffOptions

```typescript
interface GetDiffOptions {
  from: string;
  to?: string;
  cwd?: string;
  include?: string[];
  exclude?: string[];
  contextLines?: number;
}
```

### GitDiff

```typescript
interface GitDiff {
  from: string;
  to: string;
  files: FileDiff[];
  stats: DiffStats;
}
```

### FileDiff

```typescript
interface FileDiff {
  path: string;
  oldPath?: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  binary: boolean;
  before?: string;
  after?: string;
  hunks: DiffHunk[];
}
```

### FileStatus

```typescript
type FileStatus = 'added' | 'deleted' | 'modified' | 'renamed' | 'copied';
```

### CommitInfo

```typescript
interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  body?: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  committer: {
    name: string;
    email: string;
    date: Date;
  };
  parents: string[];
}
```

### RepositoryInfo

```typescript
interface RepositoryInfo {
  root: string;
  branch: string;
  commit: string;
  remote?: string;
  url?: string;
  isDirty: boolean;
}
```

### FileChange

```typescript
interface FileChange {
  path: string;
  oldPath?: string;
  status: FileStatus;
  before: string | null;
  after: string | null;
}
```

## Errors

### GitError

Thrown when Git operations fail.

```typescript
class GitError extends SEDError {
  command: string;
  exitCode: number;
  stderr: string;
}
```

### RepositoryNotFoundError

Thrown when not in a Git repository.

```typescript
class RepositoryNotFoundError extends GitError {
  path: string;
}
```

## Utilities

### isGitRepository

Check if a directory is a Git repository.

```typescript
function isGitRepository(path: string): Promise<boolean>;
```

### findRepositoryRoot

Find the root of a Git repository.

```typescript
function findRepositoryRoot(path: string): Promise<string | null>;
```

### parseRef

Parse a Git reference.

```typescript
function parseRef(ref: string): { type: 'branch' | 'tag' | 'commit'; name: string };
```

## See Also

- [Core API](/api/core)
- [Types Reference](/api/types)
- [CLI Usage](/guide/cli-usage)
