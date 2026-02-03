# @sed/core API

The core package provides AST parsing, entropy calculation, and classification functionality.

## Installation

```bash
npm install @sed/core
```

## Functions

### analyzeFile

Analyze a single file for changes.

```typescript
function analyzeFile(path: string, options?: AnalyzeFileOptions): Promise<FileAnalysis>;
```

**Parameters:**

| Name      | Type                 | Description      |
| --------- | -------------------- | ---------------- |
| `path`    | `string`             | Path to the file |
| `options` | `AnalyzeFileOptions` | Analysis options |

**Returns:** `Promise<FileAnalysis>`

**Example:**

```typescript
import { analyzeFile } from '@sed/core';

const result = await analyzeFile('src/index.ts', {
  before: oldContent,
  after: newContent,
});

console.log(result.entropy); // 2.45
console.log(result.classification); // 'medium'
console.log(result.changes); // Array of changes
```

### calculateEntropy

Calculate entropy for a set of AST changes.

```typescript
function calculateEntropy(changes: ASTChange[], options?: EntropyOptions): number;
```

**Parameters:**

| Name      | Type             | Description          |
| --------- | ---------------- | -------------------- |
| `changes` | `ASTChange[]`    | Array of AST changes |
| `options` | `EntropyOptions` | Calculation options  |

**Returns:** `number`

**Example:**

```typescript
import { calculateEntropy } from '@sed/core';

const entropy = calculateEntropy([
  { type: 'added', nodeType: 'FunctionDeclaration', name: 'handleClick' },
  { type: 'modified', nodeType: 'Expression', name: 'condition' },
]);

console.log(entropy); // 3.5
```

### classifyEntropy

Classify an entropy value into a category.

```typescript
function classifyEntropy(entropy: number, thresholds?: Thresholds): Classification;
```

**Parameters:**

| Name         | Type         | Description       |
| ------------ | ------------ | ----------------- |
| `entropy`    | `number`     | Entropy value     |
| `thresholds` | `Thresholds` | Custom thresholds |

**Returns:** `Classification`

**Example:**

```typescript
import { classifyEntropy } from '@sed/core';

classifyEntropy(0.3); // 'trivial'
classifyEntropy(1.2); // 'low'
classifyEntropy(2.5); // 'medium'
classifyEntropy(4.0); // 'high'
classifyEntropy(5.5); // 'critical'
```

### parseSource

Parse source code into an AST.

```typescript
function parseSource(source: string, options?: ParseOptions): ASTNode;
```

**Parameters:**

| Name      | Type           | Description   |
| --------- | -------------- | ------------- |
| `source`  | `string`       | Source code   |
| `options` | `ParseOptions` | Parse options |

**Returns:** `ASTNode`

**Example:**

```typescript
import { parseSource } from '@sed/core';

const ast = parseSource(
  `
  function hello() {
    console.log('Hello, world!');
  }
`,
  { language: 'typescript' }
);
```

### diffAST

Compare two ASTs and return changes.

```typescript
function diffAST(before: ASTNode, after: ASTNode, options?: DiffOptions): ASTChange[];
```

**Parameters:**

| Name      | Type          | Description  |
| --------- | ------------- | ------------ |
| `before`  | `ASTNode`     | Original AST |
| `after`   | `ASTNode`     | Modified AST |
| `options` | `DiffOptions` | Diff options |

**Returns:** `ASTChange[]`

**Example:**

```typescript
import { parseSource, diffAST } from '@sed/core';

const before = parseSource(oldCode);
const after = parseSource(newCode);

const changes = diffAST(before, after);
```

## Classes

### Analyzer

Main analyzer class for complex workflows.

```typescript
class Analyzer {
  constructor(options?: AnalyzerOptions);

  analyze(changes: FileChange[]): Promise<AnalysisResult>;
  analyzeFile(path: string, content: FileContent): Promise<FileAnalysis>;
  getParser(language: string): Parser;
  registerParser(parser: Parser): void;
}
```

**Example:**

```typescript
import { Analyzer } from '@sed/core';

const analyzer = new Analyzer({
  thresholds: { trivial: 0.3, low: 1.0, medium: 2.5, high: 4.0 },
  nodeWeights: { FunctionDeclaration: 4.0 },
});

const result = await analyzer.analyze(changes);
```

### Parser

Abstract parser class for language support.

```typescript
abstract class Parser {
  abstract readonly name: string;
  abstract readonly extensions: string[];
  abstract parse(source: string): ASTNode;
  abstract diff(before: ASTNode, after: ASTNode): ASTChange[];
}
```

## Types

### AnalyzeFileOptions

```typescript
interface AnalyzeFileOptions {
  before?: string;
  after?: string;
  language?: string;
  thresholds?: Thresholds;
  nodeWeights?: Record<string, number>;
}
```

### FileAnalysis

```typescript
interface FileAnalysis {
  path: string;
  relativePath: string;
  language: string;
  entropy: number;
  classification: Classification;
  changes: ASTChange[];
  metrics: FileMetrics;
}
```

### ASTChange

```typescript
interface ASTChange {
  type: 'added' | 'deleted' | 'modified' | 'renamed' | 'moved';
  nodeType: string;
  name: string;
  startLine: number;
  endLine: number;
  entropy: number;
  description?: string;
  children?: ASTChange[];
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

### Classification

```typescript
type Classification = 'trivial' | 'low' | 'medium' | 'high' | 'critical';
```

## Errors

### SEDError

Base error class for all SED errors.

```typescript
class SEDError extends Error {
  code: string;
  context?: Record<string, unknown>;
}
```

### ParseError

Thrown when parsing fails.

```typescript
class ParseError extends SEDError {
  line?: number;
  column?: number;
  language: string;
}
```

## Constants

### DEFAULT_THRESHOLDS

```typescript
const DEFAULT_THRESHOLDS = {
  trivial: 0.5,
  low: 1.5,
  medium: 3.0,
  high: 4.5,
};
```

### NODE_WEIGHTS

```typescript
const NODE_WEIGHTS = {
  Program: 0,
  FunctionDeclaration: 3.0,
  ClassDeclaration: 4.0,
  MethodDefinition: 2.5,
  VariableDeclaration: 1.5,
  // ...
};
```

## See Also

- [Git API](/api/git)
- [Types Reference](/api/types)
- [Core Concepts](/guide/concepts)
