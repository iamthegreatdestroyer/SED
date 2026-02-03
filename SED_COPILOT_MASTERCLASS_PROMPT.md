# SED Project Initialization: Autonomous Scaffolding Directive
## Master Prompt for GitHub Copilot Agent Mode

---

## 🎯 MISSION DIRECTIVE

You are the **Lead Architect Agent** for the Semantic Entropy Differencing (SED) project. You have been granted **MAXIMUM AUTONOMY** to design, scaffold, and implement the complete project infrastructure. Execute with the decisiveness and precision of a senior principal engineer who has built developer tools at Google/Meta scale.

**Repository:** `https://github.com/iamthegreatdestroyer/SED.git`
**Author:** Stevo (sgbilod / iamthegreatdestroyer)
**License Strategy:** MIT (core engine) + Premium API + Enterprise tiers

---

## 📋 PROJECT SPECIFICATION

### What SED Does
Semantic Entropy Differencing is an **information-theoretic code diff system** that:
1. Computes diffs based on **semantic information entropy**, not character sequences
2. Ranks changes by **behavioral impact** using call-graph propagation analysis
3. Collapses cosmetic noise (reformatting, renaming) to near-zero entropy
4. Detects **cross-language semantic equivalence** via shared embeddings
5. Provides entropy-weighted review prioritization for code reviewers

### Core Innovation
Traditional diff is O(n) character comparison producing noise-heavy output. SED achieves:
- **O(log n) change localization** via Merkle-tree semantic hashing
- **Entropy ranking** that surfaces high-impact changes first
- **AST-normalized comparison** that ignores formatting completely
- **Embedding similarity** for cross-language and rename detection

### The Entropy Formula
```
ΔS = H(Semantics_new | Semantics_old)

Where:
- H() is conditional Shannon entropy
- Semantics are extracted via AST normalization + neural embeddings
- Changes weighted by entropy contribution to program behavior
- Call-graph propagation amplifies entropy for widely-used code
```

---

## 🏗️ AUTONOMOUS EXECUTION PROTOCOL

### Phase 1: Repository Structure [EXECUTE IMMEDIATELY]

Create the following monorepo structure using **Turborepo** for build orchestration:

```
SED/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── release.yml               # Semantic release automation
│   │   ├── security.yml              # Dependency scanning
│   │   └── benchmark.yml             # Performance regression testing
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── dependabot.yml
│
├── apps/
│   ├── cli/                          # CLI application (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── diff.ts           # sed diff <old> <new> - Semantic diff
│   │   │   │   ├── analyze.ts        # sed analyze <file> - Entropy analysis
│   │   │   │   ├── blame.ts          # sed blame <file> - Entropy-weighted blame
│   │   │   │   ├── review.ts         # sed review <pr> - PR review prioritization
│   │   │   │   └── server.ts         # sed server - Start API server
│   │   │   ├── formatters/
│   │   │   │   ├── terminal.ts       # Rich terminal output
│   │   │   │   ├── json.ts           # JSON output
│   │   │   │   ├── html.ts           # HTML report generation
│   │   │   │   └── unified.ts        # Unified diff compatible
│   │   │   ├── integrations/
│   │   │   │   ├── git.ts            # Git integration helpers
│   │   │   │   └── github.ts         # GitHub API integration
│   │   │   └── index.ts              # CLI entry point (Commander.js)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── vscode/                       # VS Code Extension
│   │   ├── src/
│   │   │   ├── extension.ts          # Extension activation
│   │   │   ├── providers/
│   │   │   │   ├── diff-provider.ts  # Custom diff editor provider
│   │   │   │   ├── entropy-lens.ts   # CodeLens for entropy indicators
│   │   │   │   ├── gutter-decorator.ts # Entropy heatmap in gutter
│   │   │   │   └── hover-provider.ts # Entropy details on hover
│   │   │   ├── commands/
│   │   │   │   ├── semantic-diff.ts
│   │   │   │   ├── entropy-analysis.ts
│   │   │   │   └── collapse-noise.ts
│   │   │   ├── views/
│   │   │   │   ├── entropy-tree.ts   # Sidebar tree view
│   │   │   │   └── diff-webview.ts   # Custom diff visualization
│   │   │   └── services/
│   │   │       └── sed-client.ts     # Communicates with core engine
│   │   ├── media/
│   │   │   ├── icons/
│   │   │   └── styles/
│   │   ├── package.json              # Extension manifest
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── web/                          # Web application (API + Dashboard)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/              # API routes
│   │   │   │   │   ├── diff/route.ts
│   │   │   │   │   ├── analyze/route.ts
│   │   │   │   │   └── webhook/route.ts # GitHub webhook handler
│   │   │   │   ├── dashboard/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── diff-viewer/
│   │   │   │   ├── entropy-chart/
│   │   │   │   └── pr-review/
│   │   │   └── lib/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── github-action/                # GitHub Action for CI integration
│       ├── action.yml
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── README.md
│
├── packages/
│   ├── core/                         # Core SED Engine (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts              # Public API exports
│   │   │   ├── engine/
│   │   │   │   ├── sed-engine.ts     # Main orchestration class
│   │   │   │   ├── diff-calculator.ts # Semantic diff computation
│   │   │   │   └── entropy-ranker.ts # Entropy-based ranking
│   │   │   ├── semantic/
│   │   │   │   ├── merkle-tree.ts    # Semantic Merkle tree
│   │   │   │   ├── semantic-hash.ts  # Content-addressable hashing
│   │   │   │   ├── ast-normalizer.ts # AST normalization pipeline
│   │   │   │   └── semantic-unit.ts  # Semantic unit extraction
│   │   │   ├── entropy/
│   │   │   │   ├── entropy-calculator.ts  # Shannon entropy
│   │   │   │   ├── kl-divergence.ts       # KL divergence for embeddings
│   │   │   │   ├── conditional-entropy.ts # H(new|old) computation
│   │   │   │   └── entropy-types.ts       # Entropy classification
│   │   │   ├── embeddings/
│   │   │   │   ├── embedder.ts       # Abstract embedder interface
│   │   │   │   ├── onnx-embedder.ts  # ONNX Runtime inference
│   │   │   │   ├── similarity.ts     # Cosine similarity, etc.
│   │   │   │   └── models/           # Model weight loading
│   │   │   ├── parser/
│   │   │   │   ├── code-parser.ts    # Abstract parser interface
│   │   │   │   ├── tree-sitter/      # Tree-sitter implementations
│   │   │   │   │   ├── typescript-parser.ts
│   │   │   │   │   ├── python-parser.ts
│   │   │   │   │   ├── rust-parser.ts
│   │   │   │   │   ├── java-parser.ts
│   │   │   │   │   ├── go-parser.ts
│   │   │   │   │   └── parser-registry.ts
│   │   │   │   └── normalizer/
│   │   │   │       ├── alpha-renamer.ts    # α-renaming for identifiers
│   │   │   │       ├── format-stripper.ts  # Whitespace normalization
│   │   │   │       ├── literal-replacer.ts # Literal → type placeholders
│   │   │   │       └── comment-stripper.ts # Comment removal
│   │   │   ├── analysis/
│   │   │   │   ├── call-graph.ts     # Call graph construction
│   │   │   │   ├── propagation.ts    # Impact propagation analysis
│   │   │   │   ├── dependency-graph.ts # Module dependencies
│   │   │   │   └── scope-analyzer.ts # Variable scope analysis
│   │   │   ├── output/
│   │   │   │   ├── diff-result.ts    # Structured diff output
│   │   │   │   ├── entropy-report.ts # Entropy analysis report
│   │   │   │   └── visualization.ts  # Visualization helpers
│   │   │   └── types/
│   │   │       ├── semantic-node.ts  # AST semantic node types
│   │   │       ├── diff-types.ts     # Diff result types
│   │   │       ├── entropy-types.ts  # Entropy classification
│   │   │       └── config.ts         # Configuration types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── git-integration/              # Git plumbing integration
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── git-diff-driver.ts    # Custom git diff driver
│   │   │   ├── merge-driver.ts       # Semantic merge assistance
│   │   │   └── hooks/
│   │   │       ├── pre-commit.ts
│   │   │       └── post-merge.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── shared/                       # Shared types and utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── utils/
│   │   │       ├── hash.ts
│   │   │       ├── async.ts
│   │   │       └── math.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                       # Shared configs
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   └── base.json
│       └── package.json
│
├── models/                           # Pre-trained embedding models
│   ├── code-semantic-small/          # Lightweight model (~50MB)
│   │   ├── model.onnx
│   │   ├── tokenizer.json
│   │   └── config.json
│   ├── code-semantic-large/          # High-accuracy model (~200MB)
│   │   └── ...
│   └── README.md                     # Model documentation
│
├── docs/
│   ├── architecture.md               # System architecture
│   ├── entropy-theory.md             # Information theory background
│   ├── algorithms.md                 # Algorithm explanations
│   ├── api-reference.md              # API documentation
│   ├── cli-reference.md              # CLI commands
│   ├── vscode-extension.md           # Extension usage
│   ├── git-integration.md            # Git driver setup
│   └── commercial-licensing.md       # Premium tier info
│
├── scripts/
│   ├── setup.sh                      # Initial setup script
│   ├── download-models.ts            # Model downloader
│   ├── benchmark.ts                  # Performance benchmarking
│   └── generate-test-fixtures.ts     # Test data generation
│
├── examples/
│   ├── basic-diff/
│   ├── pr-review-integration/
│   ├── ci-pipeline/
│   └── custom-entropy-rules/
│
├── benchmarks/
│   ├── datasets/                     # Benchmark datasets (gitignored)
│   │   ├── linux-kernel-patches/
│   │   ├── typescript-migrations/
│   │   └── refactoring-samples/
│   ├── results/
│   └── run-benchmarks.ts
│
├── test-fixtures/
│   ├── diffs/
│   │   ├── cosmetic-only/            # Formatting changes
│   │   ├── rename-only/              # Variable renames
│   │   ├── semantic-change/          # Behavioral changes
│   │   └── mixed/                    # Combined changes
│   └── codebases/
│
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json (workspaces)
├── pnpm-workspace.yaml               # PNPM workspace config
├── tsconfig.json                     # Root TypeScript config
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .gitignore
├── .gitattributes                    # Git diff driver config
├── .nvmrc                            # Node version
├── LICENSE                           # MIT license
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── README.md                         # Project overview
```

### Phase 2: Configuration Files [EXECUTE IMMEDIATELY AFTER STRUCTURE]

Generate production-grade configurations:

#### `package.json` (root)
```json
{
  "name": "sed-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Semantic Entropy Differencing - Information-theoretic code diff system",
  "author": "Stevo <sgbilod@proton.me>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/iamthegreatdestroyer/SED.git"
  },
  "homepage": "https://github.com/iamthegreatdestroyer/SED",
  "bugs": {
    "url": "https://github.com/iamthegreatdestroyer/SED/issues"
  },
  "keywords": [
    "semantic-diff",
    "code-diff",
    "entropy",
    "information-theory",
    "code-review",
    "static-analysis",
    "ast",
    "developer-tools",
    "git-diff"
  ],
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "test": "turbo test",
    "test:coverage": "turbo test:coverage",
    "test:e2e": "turbo test:e2e",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install",
    "release": "changeset publish",
    "version": "changeset version",
    "benchmark": "tsx scripts/benchmark.ts",
    "download-models": "tsx scripts/download-models.ts"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.56.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "tsx": "^4.7.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

#### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "*.vsix"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm typecheck

      - name: Test
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/core/coverage/lcov.info
          fail_ci_if_error: false

  benchmark:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm benchmark
      - name: Store benchmark result
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: benchmarks/results/latest.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
```

### Phase 3: Core Package Implementation [EXECUTE SYSTEMATICALLY]

#### `packages/core/src/index.ts` - Public API
```typescript
/**
 * SED - Semantic Entropy Differencing
 * Information-theoretic code diff system
 * 
 * @packageDocumentation
 * @module @sed/core
 * @license MIT
 * 
 * Premium API and enterprise licensing: https://github.com/iamthegreatdestroyer/SED
 */

// Main Engine
export { SEDEngine, type SEDEngineConfig } from './engine/sed-engine';
export { DiffCalculator } from './engine/diff-calculator';
export { EntropyRanker } from './engine/entropy-ranker';

// Semantic Analysis
export { SemanticMerkleTree } from './semantic/merkle-tree';
export { SemanticHash } from './semantic/semantic-hash';
export { ASTNormalizer } from './semantic/ast-normalizer';

// Entropy
export { EntropyCalculator } from './entropy/entropy-calculator';
export { KLDivergence } from './entropy/kl-divergence';
export { ConditionalEntropy } from './entropy/conditional-entropy';

// Parsing
export { CodeParser, type ParseResult } from './parser/code-parser';
export { ParserRegistry } from './parser/tree-sitter/parser-registry';

// Embeddings
export { Embedder, type EmbeddingResult } from './embeddings/embedder';
export { CosineSimilarity } from './embeddings/similarity';

// Analysis
export { CallGraph } from './analysis/call-graph';
export { ImpactPropagation } from './analysis/propagation';

// Types
export type { 
  SemanticNode, 
  SemanticUnit,
  NormalizedAST 
} from './types/semantic-node';

export type { 
  DiffResult, 
  DiffHunk, 
  SemanticChange,
  ChangeType 
} from './types/diff-types';

export type { 
  EntropyScore, 
  EntropyClassification,
  EntropyReport 
} from './types/entropy-types';

export type { SEDConfig } from './types/config';

// Utilities
export { createSED } from './factory';
export { version } from './version';
```

#### `packages/core/src/semantic/merkle-tree.ts` - Semantic Merkle Tree
```typescript
/**
 * Semantic Merkle Tree
 * 
 * A content-addressable tree structure where each node's hash
 * is computed from its semantic content, not syntactic representation.
 * Enables O(log n) change detection between two code versions.
 */

import { createHash } from 'crypto';
import type { SemanticNode, SemanticUnit } from '../types/semantic-node';

export interface MerkleNode {
  /** SHA-256 hash of normalized semantic content */
  hash: string;
  /** Semantic unit type (function, class, statement, etc.) */
  type: SemanticUnit;
  /** Child node hashes */
  children: string[];
  /** Source location for mapping back to original */
  location: SourceLocation;
  /** Normalized content (for leaf nodes) */
  content?: string;
}

export interface SourceLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export interface MerkleTreeDiff {
  /** Nodes present in tree1 but not tree2 (deletions) */
  removed: MerkleNode[];
  /** Nodes present in tree2 but not tree1 (additions) */
  added: MerkleNode[];
  /** Nodes with same location but different hash (modifications) */
  modified: Array<{ old: MerkleNode; new: MerkleNode }>;
  /** Nodes unchanged */
  unchanged: MerkleNode[];
}

export class SemanticMerkleTree {
  private readonly root: MerkleNode;
  private readonly nodeMap: Map<string, MerkleNode>;

  constructor(semanticNodes: SemanticNode[]) {
    this.nodeMap = new Map();
    this.root = this.buildTree(semanticNodes);
  }

  /**
   * Build Merkle tree from semantic nodes
   * Time complexity: O(n) where n is number of semantic units
   */
  private buildTree(nodes: SemanticNode[]): MerkleNode {
    // Group nodes by parent relationship
    const rootNodes = nodes.filter(n => !n.parent);
    
    const buildNode = (node: SemanticNode): MerkleNode => {
      const children = nodes
        .filter(n => n.parent === node.id)
        .map(buildNode);
      
      const childHashes = children.map(c => c.hash);
      
      // Hash combines: node type + normalized content + child hashes
      const hashInput = [
        node.type,
        node.normalizedContent,
        ...childHashes
      ].join('|');
      
      const hash = this.computeHash(hashInput);
      
      const merkleNode: MerkleNode = {
        hash,
        type: node.type,
        children: childHashes,
        location: node.location,
        content: children.length === 0 ? node.normalizedContent : undefined,
      };
      
      this.nodeMap.set(hash, merkleNode);
      return merkleNode;
    };

    // Create virtual root if multiple top-level nodes
    if (rootNodes.length === 1) {
      return buildNode(rootNodes[0]);
    }
    
    const childNodes = rootNodes.map(buildNode);
    const rootHash = this.computeHash(childNodes.map(c => c.hash).join('|'));
    
    const root: MerkleNode = {
      hash: rootHash,
      type: 'module',
      children: childNodes.map(c => c.hash),
      location: {
        file: rootNodes[0]?.location.file ?? 'unknown',
        startLine: 0,
        endLine: 0,
        startColumn: 0,
        endColumn: 0,
      },
    };
    
    this.nodeMap.set(rootHash, root);
    return root;
  }

  private computeHash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  /**
   * Compare two Merkle trees to find semantic differences
   * Time complexity: O(log n) for localized changes, O(n) worst case
   */
  static diff(tree1: SemanticMerkleTree, tree2: SemanticMerkleTree): MerkleTreeDiff {
    const result: MerkleTreeDiff = {
      removed: [],
      added: [],
      modified: [],
      unchanged: [],
    };

    // Quick check: if roots match, trees are identical
    if (tree1.root.hash === tree2.root.hash) {
      result.unchanged = Array.from(tree1.nodeMap.values());
      return result;
    }

    // Find divergent nodes using hash comparison
    const visited1 = new Set<string>();
    const visited2 = new Set<string>();

    const compareNodes = (hash1: string | null, hash2: string | null) => {
      if (hash1 === hash2) {
        if (hash1) {
          const node = tree1.nodeMap.get(hash1);
          if (node) result.unchanged.push(node);
        }
        return;
      }

      const node1 = hash1 ? tree1.nodeMap.get(hash1) : null;
      const node2 = hash2 ? tree2.nodeMap.get(hash2) : null;

      if (!node1 && node2) {
        result.added.push(node2);
        visited2.add(hash2!);
        return;
      }

      if (node1 && !node2) {
        result.removed.push(node1);
        visited1.add(hash1!);
        return;
      }

      if (node1 && node2) {
        // Same location, different content = modification
        if (this.sameLocation(node1.location, node2.location)) {
          result.modified.push({ old: node1, new: node2 });
        } else {
          // Different subtrees - recurse into children
          const maxChildren = Math.max(node1.children.length, node2.children.length);
          for (let i = 0; i < maxChildren; i++) {
            compareNodes(node1.children[i] ?? null, node2.children[i] ?? null);
          }
        }
      }
    };

    compareNodes(tree1.root.hash, tree2.root.hash);
    return result;
  }

  private static sameLocation(loc1: SourceLocation, loc2: SourceLocation): boolean {
    return (
      loc1.file === loc2.file &&
      loc1.startLine === loc2.startLine &&
      loc1.endLine === loc2.endLine
    );
  }

  /**
   * Get the root hash (fingerprint of entire codebase)
   */
  getRootHash(): string {
    return this.root.hash;
  }

  /**
   * Get a node by its hash
   */
  getNode(hash: string): MerkleNode | undefined {
    return this.nodeMap.get(hash);
  }

  /**
   * Get all nodes at a specific depth
   */
  getNodesAtDepth(depth: number): MerkleNode[] {
    const result: MerkleNode[] = [];
    
    const traverse = (hash: string, currentDepth: number) => {
      const node = this.nodeMap.get(hash);
      if (!node) return;
      
      if (currentDepth === depth) {
        result.push(node);
        return;
      }
      
      for (const childHash of node.children) {
        traverse(childHash, currentDepth + 1);
      }
    };
    
    traverse(this.root.hash, 0);
    return result;
  }

  /**
   * Serialize tree for persistence
   */
  serialize(): string {
    return JSON.stringify({
      root: this.root.hash,
      nodes: Object.fromEntries(this.nodeMap),
    });
  }

  /**
   * Deserialize tree from persistence
   */
  static deserialize(data: string): SemanticMerkleTree {
    const parsed = JSON.parse(data);
    const tree = Object.create(SemanticMerkleTree.prototype);
    tree.nodeMap = new Map(Object.entries(parsed.nodes));
    tree.root = tree.nodeMap.get(parsed.root);
    return tree;
  }
}
```

#### `packages/core/src/entropy/entropy-calculator.ts` - Entropy Computation
```typescript
/**
 * Entropy Calculator
 * 
 * Computes Shannon entropy and related information-theoretic measures
 * for semantic code changes. Higher entropy = more significant change.
 */

import type { SemanticChange, DiffHunk } from '../types/diff-types';
import type { EntropyScore, EntropyClassification } from '../types/entropy-types';

export interface EntropyConfig {
  /** Base of logarithm (2 for bits, e for nats) */
  logBase: number;
  /** Minimum probability to avoid log(0) */
  epsilon: number;
  /** Weights for different change types */
  typeWeights: Record<string, number>;
}

const DEFAULT_CONFIG: EntropyConfig = {
  logBase: 2,
  epsilon: 1e-10,
  typeWeights: {
    'function-signature': 3.0,    // API changes are high entropy
    'function-body': 2.0,         // Implementation changes
    'control-flow': 2.5,          // Branching logic
    'type-annotation': 1.5,       // Type changes
    'variable-declaration': 1.0,  // Variable changes
    'import': 0.5,                // Import changes
    'comment': 0.1,               // Comments are low entropy
    'whitespace': 0.0,            // Formatting is zero entropy
  },
};

export class EntropyCalculator {
  private readonly config: EntropyConfig;

  constructor(config: Partial<EntropyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate Shannon entropy of a probability distribution
   * H(X) = -Σ p(x) * log(p(x))
   */
  shannon(probabilities: number[]): number {
    let entropy = 0;
    
    for (const p of probabilities) {
      if (p > this.config.epsilon) {
        entropy -= p * this.log(p);
      }
    }
    
    return entropy;
  }

  /**
   * Calculate conditional entropy H(Y|X)
   * Represents uncertainty in Y given knowledge of X
   */
  conditional(
    jointProbabilities: number[][], 
    marginalX: number[]
  ): number {
    let conditionalEntropy = 0;
    
    for (let i = 0; i < marginalX.length; i++) {
      if (marginalX[i] < this.config.epsilon) continue;
      
      // Calculate H(Y|X=x_i)
      const conditionalDist = jointProbabilities[i].map(
        p => p / marginalX[i]
      );
      const hYGivenXi = this.shannon(conditionalDist);
      
      conditionalEntropy += marginalX[i] * hYGivenXi;
    }
    
    return conditionalEntropy;
  }

  /**
   * Calculate mutual information I(X;Y) = H(Y) - H(Y|X)
   * Measures information shared between old and new code
   */
  mutualInformation(
    oldEmbedding: Float32Array,
    newEmbedding: Float32Array
  ): number {
    // Discretize embeddings for probability estimation
    const oldDist = this.embeddingToDistribution(oldEmbedding);
    const newDist = this.embeddingToDistribution(newEmbedding);
    
    const hOld = this.shannon(oldDist);
    const hNew = this.shannon(newDist);
    
    // Estimate joint distribution
    const jointDist = this.estimateJointDistribution(oldDist, newDist);
    const hJoint = this.shannonJoint(jointDist);
    
    // I(X;Y) = H(X) + H(Y) - H(X,Y)
    return hOld + hNew - hJoint;
  }

  /**
   * Calculate entropy score for a semantic change
   * Combines structural entropy with embedding divergence
   */
  calculateChangeEntropy(change: SemanticChange): EntropyScore {
    const baseEntropy = this.structuralEntropy(change);
    const embeddingEntropy = this.embeddingEntropy(change);
    const propagationFactor = this.propagationMultiplier(change);
    
    const totalEntropy = (baseEntropy + embeddingEntropy) * propagationFactor;
    
    return {
      total: totalEntropy,
      structural: baseEntropy,
      semantic: embeddingEntropy,
      propagation: propagationFactor,
      classification: this.classify(totalEntropy),
      breakdown: {
        typeWeight: this.config.typeWeights[change.type] ?? 1.0,
        sizeContribution: Math.log2(change.linesChanged + 1),
        complexityContribution: change.cyclomaticDelta ?? 0,
      },
    };
  }

  /**
   * Structural entropy based on AST change characteristics
   */
  private structuralEntropy(change: SemanticChange): number {
    const typeWeight = this.config.typeWeights[change.type] ?? 1.0;
    const sizeEntropy = Math.log2(change.linesChanged + 1);
    const nodeEntropy = Math.log2(change.nodesChanged + 1);
    
    return typeWeight * (sizeEntropy + nodeEntropy * 0.5);
  }

  /**
   * Semantic entropy from embedding space divergence
   */
  private embeddingEntropy(change: SemanticChange): number {
    if (!change.oldEmbedding || !change.newEmbedding) {
      return 0;
    }
    
    // KL divergence as proxy for semantic change magnitude
    const kl = this.klDivergence(
      this.embeddingToDistribution(change.oldEmbedding),
      this.embeddingToDistribution(change.newEmbedding)
    );
    
    return Math.min(kl, 10); // Cap to prevent extreme values
  }

  /**
   * Propagation multiplier based on call graph impact
   */
  private propagationMultiplier(change: SemanticChange): number {
    const directCallers = change.callerCount ?? 0;
    const transitiveCallers = change.transitiveCallerCount ?? 0;
    
    // Logarithmic scaling to prevent explosion
    return 1 + Math.log2(1 + directCallers) * 0.3 + 
               Math.log2(1 + transitiveCallers) * 0.1;
  }

  /**
   * KL Divergence: D_KL(P || Q) = Σ P(x) * log(P(x) / Q(x))
   */
  private klDivergence(p: number[], q: number[]): number {
    let divergence = 0;
    
    for (let i = 0; i < p.length; i++) {
      if (p[i] > this.config.epsilon && q[i] > this.config.epsilon) {
        divergence += p[i] * this.log(p[i] / q[i]);
      }
    }
    
    return divergence;
  }

  /**
   * Convert embedding to probability distribution via softmax
   */
  private embeddingToDistribution(embedding: Float32Array): number[] {
    const maxVal = Math.max(...embedding);
    const expValues = Array.from(embedding).map(v => Math.exp(v - maxVal));
    const sum = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(v => v / sum);
  }

  /**
   * Estimate joint distribution from marginals (independence assumption)
   */
  private estimateJointDistribution(p: number[], q: number[]): number[][] {
    return p.map(pi => q.map(qj => pi * qj));
  }

  /**
   * Shannon entropy for joint distribution
   */
  private shannonJoint(joint: number[][]): number {
    let entropy = 0;
    for (const row of joint) {
      for (const p of row) {
        if (p > this.config.epsilon) {
          entropy -= p * this.log(p);
        }
      }
    }
    return entropy;
  }

  /**
   * Classify entropy into human-readable categories
   */
  private classify(entropy: number): EntropyClassification {
    if (entropy < 0.5) return 'negligible';
    if (entropy < 1.5) return 'low';
    if (entropy < 3.0) return 'medium';
    if (entropy < 5.0) return 'high';
    return 'critical';
  }

  private log(x: number): number {
    return Math.log(x) / Math.log(this.config.logBase);
  }
}
```

#### `packages/core/src/engine/sed-engine.ts` - Main Engine
```typescript
/**
 * SED Engine - Main Orchestration Class
 * 
 * Coordinates semantic parsing, Merkle tree construction, entropy
 * calculation, and diff generation for information-theoretic code comparison.
 */

import { SemanticMerkleTree, type MerkleTreeDiff } from '../semantic/merkle-tree';
import { ASTNormalizer } from '../semantic/ast-normalizer';
import { EntropyCalculator, type EntropyConfig } from '../entropy/entropy-calculator';
import { ParserRegistry } from '../parser/tree-sitter/parser-registry';
import { Embedder } from '../embeddings/embedder';
import { CallGraph } from '../analysis/call-graph';
import { ImpactPropagation } from '../analysis/propagation';
import type { 
  DiffResult, 
  DiffHunk, 
  SemanticChange 
} from '../types/diff-types';
import type { EntropyScore } from '../types/entropy-types';
import type { SEDConfig } from '../types/config';

export interface SEDEngineConfig {
  /** Entropy threshold for collapsing changes (0 = show all) */
  collapseThreshold: number;
  /** Enable cross-language semantic comparison */
  crossLanguage: boolean;
  /** Enable call-graph propagation analysis */
  propagationAnalysis: boolean;
  /** Custom entropy configuration */
  entropyConfig?: Partial<EntropyConfig>;
  /** Path to embedding model */
  modelPath?: string;
}

const DEFAULT_CONFIG: SEDEngineConfig = {
  collapseThreshold: 0.1,
  crossLanguage: false,
  propagationAnalysis: true,
};

export class SEDEngine {
  private readonly config: SEDEngineConfig;
  private readonly parserRegistry: ParserRegistry;
  private readonly normalizer: ASTNormalizer;
  private readonly entropyCalculator: EntropyCalculator;
  private readonly embedder: Embedder | null;
  private callGraph: CallGraph | null = null;

  private constructor(
    config: SEDEngineConfig,
    embedder: Embedder | null
  ) {
    this.config = config;
    this.parserRegistry = new ParserRegistry();
    this.normalizer = new ASTNormalizer();
    this.entropyCalculator = new EntropyCalculator(config.entropyConfig);
    this.embedder = embedder;
  }

  /**
   * Create a new SED engine instance
   */
  static async create(config: Partial<SEDEngineConfig> = {}): Promise<SEDEngine> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    
    let embedder: Embedder | null = null;
    if (fullConfig.crossLanguage || fullConfig.modelPath) {
      embedder = await Embedder.load(fullConfig.modelPath);
    }
    
    return new SEDEngine(fullConfig, embedder);
  }

  /**
   * Compute semantic diff between two code strings
   */
  async diff(
    oldCode: string, 
    newCode: string, 
    language: string,
    filePath?: string
  ): Promise<DiffResult> {
    // Parse both versions
    const parser = this.parserRegistry.getParser(language);
    const oldAST = parser.parse(oldCode);
    const newAST = parser.parse(newCode);

    // Normalize ASTs to semantic representation
    const oldNormalized = this.normalizer.normalize(oldAST, language);
    const newNormalized = this.normalizer.normalize(newAST, language);

    // Build Merkle trees
    const oldTree = new SemanticMerkleTree(oldNormalized);
    const newTree = new SemanticMerkleTree(newNormalized);

    // Find structural differences
    const treeDiff = SemanticMerkleTree.diff(oldTree, newTree);

    // Build call graph for propagation analysis
    if (this.config.propagationAnalysis) {
      this.callGraph = CallGraph.fromAST(newAST);
    }

    // Convert to semantic changes with entropy scores
    const changes = await this.processChanges(treeDiff, oldCode, newCode);

    // Generate hunks sorted by entropy
    const hunks = this.generateHunks(changes);

    // Calculate summary statistics
    const summary = this.calculateSummary(changes);

    return {
      filePath: filePath ?? 'unknown',
      language,
      hunks,
      summary,
      oldHash: oldTree.getRootHash(),
      newHash: newTree.getRootHash(),
      totalEntropy: summary.totalEntropy,
    };
  }

  /**
   * Diff two files from the filesystem
   */
  async diffFiles(oldPath: string, newPath: string): Promise<DiffResult> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const oldCode = await fs.readFile(oldPath, 'utf-8');
    const newCode = await fs.readFile(newPath, 'utf-8');
    
    const ext = path.extname(newPath).slice(1);
    const language = this.parserRegistry.getLanguageForExtension(ext);
    
    return this.diff(oldCode, newCode, language, newPath);
  }

  /**
   * Diff a git commit range
   */
  async diffGitRange(
    repoPath: string, 
    fromRef: string, 
    toRef: string
  ): Promise<DiffResult[]> {
    const { execSync } = await import('child_process');
    
    // Get list of changed files
    const filesOutput = execSync(
      `git diff --name-only ${fromRef}..${toRef}`,
      { cwd: repoPath, encoding: 'utf-8' }
    );
    
    const files = filesOutput.trim().split('\n').filter(Boolean);
    const results: DiffResult[] = [];
    
    for (const file of files) {
      try {
        const oldCode = execSync(
          `git show ${fromRef}:${file}`,
          { cwd: repoPath, encoding: 'utf-8' }
        );
        const newCode = execSync(
          `git show ${toRef}:${file}`,
          { cwd: repoPath, encoding: 'utf-8' }
        );
        
        const ext = file.split('.').pop() ?? '';
        const language = this.parserRegistry.getLanguageForExtension(ext);
        
        if (language) {
          const diff = await this.diff(oldCode, newCode, language, file);
          results.push(diff);
        }
      } catch {
        // File may have been added or deleted
        continue;
      }
    }
    
    return results;
  }

  /**
   * Process Merkle diff into semantic changes with entropy
   */
  private async processChanges(
    treeDiff: MerkleTreeDiff,
    oldCode: string,
    newCode: string
  ): Promise<SemanticChange[]> {
    const changes: SemanticChange[] = [];

    // Process modifications
    for (const { old: oldNode, new: newNode } of treeDiff.modified) {
      const change: SemanticChange = {
        type: newNode.type,
        changeType: 'modified',
        location: newNode.location,
        oldContent: oldNode.content,
        newContent: newNode.content,
        linesChanged: Math.abs(
          newNode.location.endLine - newNode.location.startLine -
          (oldNode.location.endLine - oldNode.location.startLine)
        ) + 1,
        nodesChanged: 1,
      };

      // Add embeddings if available
      if (this.embedder && oldNode.content && newNode.content) {
        change.oldEmbedding = await this.embedder.embed(oldNode.content);
        change.newEmbedding = await this.embedder.embed(newNode.content);
      }

      // Add call graph info
      if (this.callGraph && change.type === 'function') {
        const funcName = this.extractFunctionName(newNode.content ?? '');
        change.callerCount = this.callGraph.getDirectCallers(funcName).length;
        change.transitiveCallerCount = this.callGraph.getTransitiveCallers(funcName).length;
      }

      // Calculate entropy
      change.entropy = this.entropyCalculator.calculateChangeEntropy(change);
      changes.push(change);
    }

    // Process additions
    for (const node of treeDiff.added) {
      const change: SemanticChange = {
        type: node.type,
        changeType: 'added',
        location: node.location,
        newContent: node.content,
        linesChanged: node.location.endLine - node.location.startLine + 1,
        nodesChanged: 1,
      };
      
      change.entropy = this.entropyCalculator.calculateChangeEntropy(change);
      changes.push(change);
    }

    // Process deletions
    for (const node of treeDiff.removed) {
      const change: SemanticChange = {
        type: node.type,
        changeType: 'deleted',
        location: node.location,
        oldContent: node.content,
        linesChanged: node.location.endLine - node.location.startLine + 1,
        nodesChanged: 1,
      };
      
      change.entropy = this.entropyCalculator.calculateChangeEntropy(change);
      changes.push(change);
    }

    return changes;
  }

  /**
   * Generate diff hunks sorted by entropy (highest first)
   */
  private generateHunks(changes: SemanticChange[]): DiffHunk[] {
    // Filter out below-threshold changes
    const significantChanges = changes.filter(
      c => (c.entropy?.total ?? 0) >= this.config.collapseThreshold
    );

    // Sort by entropy descending
    significantChanges.sort(
      (a, b) => (b.entropy?.total ?? 0) - (a.entropy?.total ?? 0)
    );

    // Convert to hunks
    return significantChanges.map((change, index) => ({
      index,
      change,
      entropy: change.entropy!,
      collapsed: false,
    }));
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(changes: SemanticChange[]) {
    const totalEntropy = changes.reduce(
      (sum, c) => sum + (c.entropy?.total ?? 0), 
      0
    );

    const byClassification = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      negligible: 0,
    };

    for (const change of changes) {
      const classification = change.entropy?.classification ?? 'negligible';
      byClassification[classification]++;
    }

    return {
      totalChanges: changes.length,
      totalEntropy,
      averageEntropy: changes.length > 0 ? totalEntropy / changes.length : 0,
      byClassification,
      collapsed: changes.filter(
        c => (c.entropy?.total ?? 0) < this.config.collapseThreshold
      ).length,
    };
  }

  private extractFunctionName(content: string): string {
    // Simple extraction - would be more sophisticated in production
    const match = content.match(/(?:function|def|fn)\s+(\w+)/);
    return match?.[1] ?? 'anonymous';
  }
}
```

### Phase 4: CLI Application [EXECUTE AFTER CORE]

#### `apps/cli/src/index.ts`
```typescript
#!/usr/bin/env node
/**
 * SED CLI - Semantic Entropy Differencing Command Line Interface
 * 
 * @license MIT
 */

import { Command } from 'commander';
import { version } from '@sed/core';
import { diffCommand } from './commands/diff';
import { analyzeCommand } from './commands/analyze';
import { blameCommand } from './commands/blame';
import { reviewCommand } from './commands/review';
import { serverCommand } from './commands/server';

const program = new Command();

program
  .name('sed')
  .description('Semantic Entropy Differencing - Information-theoretic code diff')
  .version(version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--no-color', 'Disable colored output');

program.addCommand(diffCommand);
program.addCommand(analyzeCommand);
program.addCommand(blameCommand);
program.addCommand(reviewCommand);
program.addCommand(serverCommand);

program.parse();
```

#### `apps/cli/src/commands/diff.ts`
```typescript
/**
 * Diff command - Compute semantic entropy diff between files or commits
 */

import { Command } from 'commander';
import { SEDEngine, type DiffResult } from '@sed/core';
import ora from 'ora';
import chalk from 'chalk';

export const diffCommand = new Command('diff')
  .description('Compute semantic entropy diff between two files or git refs')
  .argument('[target1]', 'First file/ref (or git range like HEAD~1..HEAD)')
  .argument('[target2]', 'Second file/ref (optional for git range)')
  .option('-t, --threshold <number>', 'Entropy threshold for collapsing', '0.1')
  .option('-o, --output <format>', 'Output format (terminal|json|html|unified)', 'terminal')
  .option('--no-collapse', 'Show all changes without collapsing')
  .option('--propagation', 'Enable call-graph propagation analysis', true)
  .option('--cross-language', 'Enable cross-language semantic comparison')
  .option('--git', 'Treat arguments as git refs')
  .option('--staged', 'Diff staged changes')
  .action(async (target1: string | undefined, target2: string | undefined, options) => {
    const spinner = ora('Initializing SED engine...').start();
    
    try {
      const engine = await SEDEngine.create({
        collapseThreshold: options.collapse === false ? 0 : parseFloat(options.threshold),
        crossLanguage: options.crossLanguage,
        propagationAnalysis: options.propagation,
      });

      let results: DiffResult[];

      if (options.staged) {
        spinner.text = 'Analyzing staged changes...';
        results = await engine.diffGitRange('.', '--cached', 'HEAD');
      } else if (options.git || target1?.includes('..')) {
        // Git range diff
        const range = target1?.includes('..') 
          ? target1.split('..') 
          : [target1 ?? 'HEAD~1', target2 ?? 'HEAD'];
        
        spinner.text = `Analyzing ${range[0]}..${range[1]}...`;
        results = await engine.diffGitRange('.', range[0], range[1]);
      } else if (target1 && target2) {
        // File diff
        spinner.text = `Comparing ${target1} and ${target2}...`;
        const result = await engine.diffFiles(target1, target2);
        results = [result];
      } else {
        spinner.fail('Please provide files to diff or use --git for git refs');
        process.exit(1);
      }

      spinner.succeed(`Analyzed ${results.length} file(s)`);

      // Output results
      formatOutput(results, options.output);

    } catch (error) {
      spinner.fail('Diff failed');
      console.error(chalk.red(error instanceof Error ? error.message : error));
      process.exit(1);
    }
  });

function formatOutput(results: DiffResult[], format: string): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(results, null, 2));
      break;
    case 'html':
      console.log(generateHtmlReport(results));
      break;
    case 'unified':
      console.log(generateUnifiedDiff(results));
      break;
    case 'terminal':
    default:
      printTerminalOutput(results);
  }
}

function printTerminalOutput(results: DiffResult[]): void {
  for (const result of results) {
    console.log(chalk.bold.cyan(`\n📄 ${result.filePath}`));
    console.log(chalk.gray(`   Total Entropy: ${result.totalEntropy.toFixed(2)} bits`));
    console.log(chalk.gray(`   ${result.summary.totalChanges} changes (${result.summary.collapsed} collapsed)\n`));

    for (const hunk of result.hunks) {
      const entropy = hunk.entropy;
      const icon = getEntropyIcon(entropy.classification);
      const color = getEntropyColor(entropy.classification);
      
      console.log(
        color(`${icon} ${entropy.classification.toUpperCase()} (${entropy.total.toFixed(2)} bits)`)
      );
      console.log(
        chalk.gray(`   Line ${hunk.change.location.startLine}: ${hunk.change.type} ${hunk.change.changeType}`)
      );
      
      if (hunk.change.callerCount) {
        console.log(
          chalk.gray(`   └─ Propagates to: ${hunk.change.callerCount} direct callers, ${hunk.change.transitiveCallerCount} total`)
        );
      }
      
      console.log();
    }

    // Summary by classification
    console.log(chalk.bold('  Summary:'));
    const { byClassification } = result.summary;
    if (byClassification.critical > 0) 
      console.log(chalk.red(`    🔴 Critical: ${byClassification.critical}`));
    if (byClassification.high > 0) 
      console.log(chalk.yellow(`    🟠 High: ${byClassification.high}`));
    if (byClassification.medium > 0) 
      console.log(chalk.blue(`    🟡 Medium: ${byClassification.medium}`));
    if (byClassification.low > 0) 
      console.log(chalk.gray(`    ⚪ Low: ${byClassification.low}`));
    if (byClassification.negligible > 0) 
      console.log(chalk.dim(`    ⬜ Negligible: ${byClassification.negligible} (collapsed)`));
  }
}

function getEntropyIcon(classification: string): string {
  switch (classification) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '⚪';
    default: return '⬜';
  }
}

function getEntropyColor(classification: string): (text: string) => string {
  switch (classification) {
    case 'critical': return chalk.red.bold;
    case 'high': return chalk.yellow;
    case 'medium': return chalk.blue;
    case 'low': return chalk.gray;
    default: return chalk.dim;
  }
}

function generateHtmlReport(results: DiffResult[]): string {
  // HTML report generation
  return `<!DOCTYPE html>
<html>
<head>
  <title>SED Diff Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .critical { color: #dc3545; }
    .high { color: #fd7e14; }
    .medium { color: #ffc107; }
    .low { color: #6c757d; }
  </style>
</head>
<body>
  <h1>Semantic Entropy Diff Report</h1>
  ${results.map(r => `
    <h2>${r.filePath}</h2>
    <p>Total Entropy: ${r.totalEntropy.toFixed(2)} bits</p>
    <ul>
      ${r.hunks.map(h => `
        <li class="${h.entropy.classification}">
          ${h.entropy.classification}: ${h.change.type} at line ${h.change.location.startLine}
          (${h.entropy.total.toFixed(2)} bits)
        </li>
      `).join('')}
    </ul>
  `).join('')}
</body>
</html>`;
}

function generateUnifiedDiff(results: DiffResult[]): string {
  // Unified diff format with entropy annotations
  let output = '';
  for (const result of results) {
    output += `--- a/${result.filePath}\n`;
    output += `+++ b/${result.filePath}\n`;
    output += `# SED Total Entropy: ${result.totalEntropy.toFixed(2)} bits\n`;
    // Add hunks in unified format...
  }
  return output;
}
```

### Phase 5: VS Code Extension [EXECUTE AFTER CLI]

#### `apps/vscode/package.json`
```json
{
  "name": "sed-vscode",
  "displayName": "SED - Semantic Entropy Diff",
  "description": "Information-theoretic code diff with entropy-ranked changes",
  "version": "0.0.1",
  "publisher": "iamthegreatdestroyer",
  "repository": {
    "type": "git",
    "url": "https://github.com/iamthegreatdestroyer/SED.git"
  },
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "SCM Providers",
    "Other"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "sed.semanticDiff",
        "title": "SED: Semantic Diff"
      },
      {
        "command": "sed.analyzeEntropy",
        "title": "SED: Analyze File Entropy"
      },
      {
        "command": "sed.collapseNoise",
        "title": "SED: Collapse Low-Entropy Changes"
      },
      {
        "command": "sed.showEntropyReport",
        "title": "SED: Show Entropy Report"
      }
    ],
    "views": {
      "scm": [
        {
          "id": "sedEntropyTree",
          "name": "Entropy Analysis"
        }
      ]
    },
    "configuration": {
      "title": "SED",
      "properties": {
        "sed.collapseThreshold": {
          "type": "number",
          "default": 0.1,
          "description": "Entropy threshold for collapsing changes (bits)"
        },
        "sed.showEntropyLens": {
          "type": "boolean",
          "default": true,
          "description": "Show entropy indicators as CodeLens"
        },
        "sed.showGutterHeatmap": {
          "type": "boolean",
          "default": true,
          "description": "Show entropy heatmap in gutter"
        },
        "sed.propagationAnalysis": {
          "type": "boolean",
          "default": true,
          "description": "Enable call-graph propagation analysis"
        }
      }
    },
    "colors": [
      {
        "id": "sed.entropyCritical",
        "description": "Color for critical entropy changes",
        "defaults": { "dark": "#ff4444", "light": "#dc3545" }
      },
      {
        "id": "sed.entropyHigh",
        "description": "Color for high entropy changes",
        "defaults": { "dark": "#ff8c00", "light": "#fd7e14" }
      },
      {
        "id": "sed.entropyMedium",
        "description": "Color for medium entropy changes",
        "defaults": { "dark": "#ffd700", "light": "#ffc107" }
      },
      {
        "id": "sed.entropyLow",
        "description": "Color for low entropy changes",
        "defaults": { "dark": "#888888", "light": "#6c757d" }
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "pnpm run build",
    "build": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "watch": "pnpm run build --watch",
    "package": "vsce package --no-dependencies",
    "publish": "vsce publish --no-dependencies"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^2.22.0",
    "esbuild": "^0.19.0"
  },
  "dependencies": {
    "@sed/core": "workspace:*"
  }
}
```

#### `apps/vscode/src/extension.ts`
```typescript
/**
 * SED VS Code Extension
 * Semantic Entropy Differencing for Visual Studio Code
 * 
 * @license MIT
 */

import * as vscode from 'vscode';
import { SEDEngine } from '@sed/core';
import { EntropyLensProvider } from './providers/entropy-lens';
import { GutterDecorator } from './providers/gutter-decorator';
import { EntropyTreeProvider } from './views/entropy-tree';
import { DiffWebviewProvider } from './views/diff-webview';

let engine: SEDEngine;
let entropyLensProvider: EntropyLensProvider;
let gutterDecorator: GutterDecorator;
let treeProvider: EntropyTreeProvider;

export async function activate(context: vscode.ExtensionContext) {
  console.log('SED extension activating...');

  // Initialize engine
  const config = vscode.workspace.getConfiguration('sed');
  engine = await SEDEngine.create({
    collapseThreshold: config.get('collapseThreshold', 0.1),
    propagationAnalysis: config.get('propagationAnalysis', true),
  });

  // Register providers
  entropyLensProvider = new EntropyLensProvider(engine);
  gutterDecorator = new GutterDecorator(engine);
  treeProvider = new EntropyTreeProvider(engine);

  // CodeLens provider
  if (config.get('showEntropyLens', true)) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { scheme: 'file' },
        entropyLensProvider
      )
    );
  }

  // Tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('sedEntropyTree', treeProvider)
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.semanticDiff', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found');
        return;
      }

      const git = gitExtension.exports.getAPI(1);
      const repo = git.repositories[0];
      if (!repo) {
        vscode.window.showErrorMessage('No git repository found');
        return;
      }

      const filePath = editor.document.uri.fsPath;
      
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Computing semantic diff...',
          cancellable: false,
        },
        async () => {
          try {
            const results = await engine.diffGitRange(
              repo.rootUri.fsPath,
              'HEAD~1',
              'HEAD'
            );
            
            const fileResult = results.find(r => r.filePath.endsWith(filePath));
            if (fileResult) {
              await showDiffWebview(context, fileResult);
            } else {
              vscode.window.showInformationMessage('No changes detected');
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Diff failed: ${error instanceof Error ? error.message : error}`
            );
          }
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sed.analyzeEntropy', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      // Analyze current file entropy
      await gutterDecorator.analyze(editor);
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sed.collapseNoise', () => {
      entropyLensProvider.toggleCollapseMode();
      vscode.window.showInformationMessage(
        'Low-entropy changes collapsed. Click CodeLens to expand.'
      );
    })
  );

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('sed')) {
        const newConfig = vscode.workspace.getConfiguration('sed');
        engine = await SEDEngine.create({
          collapseThreshold: newConfig.get('collapseThreshold', 0.1),
          propagationAnalysis: newConfig.get('propagationAnalysis', true),
        });
      }
    })
  );

  // Watch for file changes
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const editor = vscode.window.visibleTextEditors.find(
        e => e.document === document
      );
      if (editor && vscode.workspace.getConfiguration('sed').get('showGutterHeatmap', true)) {
        await gutterDecorator.analyze(editor);
      }
    })
  );

  console.log('SED extension activated');
}

async function showDiffWebview(
  context: vscode.ExtensionContext, 
  result: import('@sed/core').DiffResult
) {
  const panel = vscode.window.createWebviewPanel(
    'sedDiff',
    `SED: ${result.filePath}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = DiffWebviewProvider.getHtml(result);
}

export function deactivate() {
  console.log('SED extension deactivated');
}
```

---

## 🚀 EXECUTION INSTRUCTIONS

### IMMEDIATE ACTIONS (Execute in Order):

1. **Clone & Initialize**
   ```bash
   git clone https://github.com/iamthegreatdestroyer/SED.git
   cd SED
   pnpm install
   ```

2. **Create Complete Directory Structure**
   Generate all directories and placeholder files as specified above.

3. **Generate All Configuration Files**
   Create every config file with production-ready settings.

4. **Implement Core SED Engine**
   Build out `packages/core` with:
   - Semantic Merkle tree
   - Entropy calculator
   - AST normalizers
   - Call-graph analysis

5. **Build CLI Application**
   Implement all commands in `apps/cli`.

6. **Create VS Code Extension**
   Set up extension structure in `apps/vscode`.

7. **Write Comprehensive Tests**
   Create test suites with entropy test fixtures.

8. **Generate Documentation**
   Write all markdown documentation files.

### AUTONOMY PARAMETERS

- **DO NOT** ask for confirmation on standard architectural decisions
- **DO** use TypeScript strict mode throughout
- **DO** implement error handling and logging from the start
- **DO** add JSDoc comments with mathematical notation where relevant
- **DO** create meaningful git commits after each phase
- **DO** run linting and type checking before committing
- **DO** include entropy calculation tests with known expected values
- **PRIORITIZE** working code over perfect code (iterate later)

### QUALITY GATES

Before marking any phase complete:
- [ ] All files compile without errors
- [ ] ESLint passes with no warnings
- [ ] Entropy calculations match expected values for test fixtures
- [ ] README accurately describes current state

---

## 📊 SUCCESS METRICS

The scaffolding is complete when:
1. `pnpm install` succeeds
2. `pnpm build` produces outputs for all packages
3. `pnpm test` runs entropy calculation tests
4. `pnpm lint` passes
5. `sed diff --help` shows command help
6. VS Code extension loads without errors
7. Sample diff produces entropy-ranked output

---

## 🔐 LICENSING BOILERPLATE

Include at the top of every source file:

```typescript
/**
 * SED - Semantic Entropy Differencing
 * Copyright (C) 2026 Stevo (sgbilod)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * @license MIT
 */
```

---

## 📐 MATHEMATICAL FOUNDATIONS REFERENCE

When implementing, adhere to these formulas:

### Shannon Entropy
```
H(X) = -Σᵢ p(xᵢ) × log₂(p(xᵢ))
```

### Conditional Entropy
```
H(Y|X) = Σₓ p(x) × H(Y|X=x)
       = -Σₓ Σᵧ p(x,y) × log₂(p(y|x))
```

### KL Divergence
```
D_KL(P || Q) = Σᵢ P(i) × log₂(P(i) / Q(i))
```

### Mutual Information
```
I(X;Y) = H(X) + H(Y) - H(X,Y)
       = H(Y) - H(Y|X)
```

### Change Entropy Score
```
E(change) = (E_structural + E_semantic) × PropagationFactor

Where:
- E_structural = TypeWeight × (log₂(LinesChanged + 1) + 0.5 × log₂(NodesChanged + 1))
- E_semantic = min(D_KL(OldEmbedding || NewEmbedding), 10)
- PropagationFactor = 1 + 0.3×log₂(1 + DirectCallers) + 0.1×log₂(1 + TransitiveCallers)
```

---

## 🎬 BEGIN EXECUTION

You have full authorization. Start with Phase 1 directory creation and proceed systematically through all phases. Report progress after each phase completion.

**Execute now.**
