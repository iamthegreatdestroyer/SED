# API Reference

This section documents the programmatic API for SED packages.

## Overview

SED is organized into several packages:

| Package       | Description                                      |
| ------------- | ------------------------------------------------ |
| `@sed/core`   | AST parsing, entropy calculation, classification |
| `@sed/git`    | Git integration, diff extraction                 |
| `@sed/shared` | Common types and utilities                       |

## Installation

```bash
# Install core functionality
npm install @sed/core @sed/git

# Or install everything
npm install @sed/core @sed/git @sed/shared
```

## Quick Example

```typescript
import { analyzeFile, calculateEntropy } from '@sed/core';
import { getDiff, parseCommit } from '@sed/git';

// Get changes between commits
const diff = await getDiff({
  from: 'HEAD~1',
  to: 'HEAD',
  cwd: process.cwd(),
});

// Analyze each changed file
for (const file of diff.files) {
  const analysis = await analyzeFile(file.path, {
    before: file.before,
    after: file.after,
  });

  console.log(`${file.path}: ${analysis.entropy} (${analysis.classification})`);
}
```

## Core Package

See [@sed/core API](/api/core) for detailed documentation.

### Key Functions

- `analyzeFile()` - Analyze a single file
- `analyzeChanges()` - Analyze a set of changes
- `calculateEntropy()` - Calculate entropy for AST changes
- `classifyEntropy()` - Classify entropy value
- `parseSource()` - Parse source code to AST

## Git Package

See [@sed/git API](/api/git) for detailed documentation.

### Key Functions

- `getDiff()` - Get diff between commits
- `getChangedFiles()` - List changed files
- `parseCommit()` - Parse commit information
- `getFileContent()` - Get file content at commit

## Types

See [Types Reference](/api/types) for all TypeScript types.

### Core Types

```typescript
interface AnalysisResult {
  files: FileAnalysis[];
  summary: AnalysisSummary;
}

interface FileAnalysis {
  path: string;
  entropy: number;
  classification: Classification;
  changes: Change[];
}

type Classification = 'trivial' | 'low' | 'medium' | 'high' | 'critical';
```

## Error Handling

All SED packages throw typed errors:

```typescript
import { SEDError, ParseError, GitError } from '@sed/core';

try {
  await analyzeFile(path);
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Failed to parse file:', error.message);
  } else if (error instanceof GitError) {
    console.error('Git operation failed:', error.message);
  }
}
```

## Configuration

Pass configuration options to analysis functions:

```typescript
const result = await analyzeChanges(changes, {
  thresholds: {
    trivial: 0.5,
    low: 1.5,
    medium: 3.0,
    high: 4.5,
  },
  include: ['**/*.ts'],
  exclude: ['**/*.test.ts'],
  nodeWeights: {
    FunctionDeclaration: 3.0,
    ClassDeclaration: 4.0,
  },
});
```

## Streaming API

For large repositories, use streaming analysis:

```typescript
import { createAnalysisStream } from '@sed/core';

const stream = createAnalysisStream({
  from: 'HEAD~100',
  to: 'HEAD',
});

for await (const fileResult of stream) {
  console.log(fileResult.path, fileResult.entropy);
}
```

## Plugin System

Extend SED with custom parsers:

```typescript
import { registerParser } from '@sed/core';

registerParser({
  name: 'custom-lang',
  extensions: ['.custom'],
  parse: (source) => {
    // Return AST
    return { type: 'Program', body: [] };
  },
  diff: (before, after) => {
    // Return changes
    return [];
  },
});
```

## Next Steps

- [Core API](/api/core) - Full @sed/core documentation
- [Git API](/api/git) - Full @sed/git documentation
- [Types](/api/types) - Complete type reference
