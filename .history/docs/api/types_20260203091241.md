# Types Reference

Complete TypeScript type definitions for SED packages.

## Core Types

### Classification

```typescript
type Classification = 'trivial' | 'low' | 'medium' | 'high' | 'critical';
```

### FileStatus

```typescript
type FileStatus = 'added' | 'deleted' | 'modified' | 'renamed' | 'copied';
```

### ChangeType

```typescript
type ChangeType = 'added' | 'deleted' | 'modified' | 'renamed' | 'moved';
```

## Analysis Types

### AnalysisResult

```typescript
interface AnalysisResult {
  from: string;
  to: string;
  timestamp: string;
  files: FileAnalysis[];
  summary: AnalysisSummary;
}
```

### FileAnalysis

```typescript
interface FileAnalysis {
  path: string;
  relativePath: string;
  status: FileStatus;
  language: string;
  classification: Classification;
  entropy: number;
  changes: ASTChange[];
  metrics: FileMetrics;
}
```

### ASTChange

```typescript
interface ASTChange {
  type: ChangeType;
  nodeType: string;
  name: string;
  startLine: number;
  endLine: number;
  entropy: number;
  description?: string;
  children?: ASTChange[];
  before?: ASTNode;
  after?: ASTNode;
}
```

### AnalysisSummary

```typescript
interface AnalysisSummary {
  totalFiles: number;
  totalEntropy: number;
  averageEntropy: number;
  maxEntropy: number;
  minEntropy: number;
  classifications: Record<Classification, number>;
  highestImpact: string[];
  byLanguage: Record<string, LanguageStats>;
}
```

### FileMetrics

```typescript
interface FileMetrics {
  additions: number;
  deletions: number;
  modifications: number;
  linesChanged: number;
  complexity?: number;
}
```

### LanguageStats

```typescript
interface LanguageStats {
  files: number;
  entropy: number;
  averageEntropy: number;
}
```

## Configuration Types

### SEDConfig

```typescript
interface SEDConfig {
  include?: string[];
  exclude?: string[];
  thresholds?: Thresholds;
  nodeWeights?: Record<string, number>;
  contextRules?: ContextRule[];
  output?: OutputConfig;
}
```

### Thresholds

```typescript
interface Thresholds {
  trivial: number;
  low: number;
  medium: number;
  high: number;
}
```

### ContextRule

```typescript
interface ContextRule {
  pattern: string;
  factor: number;
  name?: string;
}
```

### OutputConfig

```typescript
interface OutputConfig {
  format: 'text' | 'json' | 'markdown' | 'html';
  colors?: boolean;
  verbose?: boolean;
  showChanges?: boolean;
  maxFiles?: number;
}
```

## Git Types

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

### DiffHunk

```typescript
interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}
```

### DiffLine

```typescript
interface DiffLine {
  type: 'context' | 'add' | 'delete';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}
```

### DiffStats

```typescript
interface DiffStats {
  files: number;
  additions: number;
  deletions: number;
}
```

### CommitInfo

```typescript
interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  body?: string;
  author: Person;
  committer: Person;
  date: Date;
  parents: string[];
}
```

### Person

```typescript
interface Person {
  name: string;
  email: string;
  date?: Date;
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
  ahead?: number;
  behind?: number;
}
```

## AST Types

### ASTNode

```typescript
interface ASTNode {
  type: string;
  name?: string;
  value?: unknown;
  start: Position;
  end: Position;
  children?: ASTNode[];
  metadata?: Record<string, unknown>;
}
```

### Position

```typescript
interface Position {
  line: number;
  column: number;
  offset: number;
}
```

## Parser Types

### Parser

```typescript
interface Parser {
  name: string;
  extensions: string[];
  parse(source: string, options?: ParseOptions): ASTNode;
  diff(before: ASTNode, after: ASTNode, options?: DiffOptions): ASTChange[];
}
```

### ParseOptions

```typescript
interface ParseOptions {
  language?: string;
  jsx?: boolean;
  typescript?: boolean;
  sourceType?: 'script' | 'module';
  ecmaVersion?: number;
}
```

### DiffOptions

```typescript
interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreComments?: boolean;
  contextLines?: number;
}
```

## CLI Types

### CLIOptions

```typescript
interface CLIOptions {
  from: string;
  to?: string;
  path?: string;
  include?: string[];
  exclude?: string[];
  format?: 'text' | 'json' | 'markdown';
  output?: string;
  verbose?: boolean;
  quiet?: boolean;
  color?: boolean;
}
```

### WatchOptions

```typescript
interface WatchOptions {
  path: string;
  include?: string[];
  exclude?: string[];
  debounce?: number;
}
```

## Action Types

### ActionInputs

```typescript
interface ActionInputs {
  base: string;
  head: string;
  path: string;
  include: string;
  exclude: string;
  failOn: Classification | 'never';
  threshold: string;
  comment: boolean;
  jsonOutput: string;
  markdownOutput: string;
  summary: boolean;
}
```

### ActionResult

```typescript
interface ActionResult {
  analysis: AnalysisResult;
  summary: {
    totalEntropy: number;
    averageEntropy: number;
    totalFiles: number;
  };
  classification: Classification;
  shouldFail: boolean;
  failureMessage?: string;
}
```

## Error Types

### SEDError

```typescript
class SEDError extends Error {
  code: string;
  context?: Record<string, unknown>;
}
```

### ParseError

```typescript
class ParseError extends SEDError {
  line?: number;
  column?: number;
  language: string;
  source?: string;
}
```

### GitError

```typescript
class GitError extends SEDError {
  command: string;
  exitCode: number;
  stderr: string;
}
```

## Utility Types

### DeepPartial

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Prettify

```typescript
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

## See Also

- [Core API](/api/core)
- [Git API](/api/git)
- [API Overview](/api/)
