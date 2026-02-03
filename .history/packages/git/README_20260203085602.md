# @sed/git

Git integration package for Semantic Entropy Differencing.

## Overview

This package provides Git operations for SED, including:

- Repository discovery and validation
- Commit parsing and history traversal
- Diff extraction at file and content level
- File content retrieval across revisions
- Branch and tag management

## Installation

```bash
pnpm add @sed/git
```

## Usage

```typescript
import { GitClient, DiffExtractor, CommitParser } from '@sed/git';

// Initialize Git client
const git = new GitClient('/path/to/repo');

// Extract diff between commits
const extractor = new DiffExtractor(git);
const diff = await extractor.extractDiff('HEAD~1', 'HEAD');

// Parse commit information
const parser = new CommitParser(git);
const commits = await parser.parseRange('HEAD~10', 'HEAD');
```

## API

### GitClient

Core Git operations wrapper.

```typescript
const git = new GitClient(repoPath);

// Basic operations
await git.isRepo();
await git.getRoot();
await git.getCurrentBranch();
await git.getCurrentCommit();

// File operations
await git.getFileContent('path/to/file.ts', 'HEAD');
await git.getChangedFiles('HEAD~1', 'HEAD');

// History
await git.getCommitLog(10);
await git.getCommitsBetween('v1.0.0', 'HEAD');
```

### DiffExtractor

Extract and process Git diffs.

```typescript
const extractor = new DiffExtractor(git);

// Get diff summary
const diff = await extractor.extractDiff('main', 'feature');

// Get file-level changes
const files = await extractor.getChangedFiles('HEAD~1', 'HEAD');

// Get content diff for specific file
const content = await extractor.getFileDiff('src/index.ts', 'HEAD~1', 'HEAD');
```

### CommitParser

Parse commit metadata and messages.

```typescript
const parser = new CommitParser(git);

// Parse single commit
const commit = await parser.parse('abc123');

// Parse commit range
const commits = await parser.parseRange('HEAD~5', 'HEAD');

// Get commit with conventional commit parsing
const parsed = await parser.parseConventional('HEAD');
```

## Configuration

```typescript
import { GitClient } from '@sed/git';

const git = new GitClient('/repo', {
  timeout: 30000, // Operation timeout in ms
  maxBuffer: 50 * 1024 * 1024, // Max stdout buffer
  binary: 'git', // Git binary path
});
```

## License

MIT © Stevo (sgbilod)
