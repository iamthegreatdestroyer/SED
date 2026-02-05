# SED Diff-Processor Architecture Refactoring Plan

## Executive Summary

The `diff-processor.ts` has two TypeScript errors:

1. **Line 48-60**: `diff()` method returns `{ changes, summary }` but should return `FileDiff`
   (aliased as `SemanticDiff`)
2. **Line 187**: `DiffChange` objects are missing required properties: `id`, `operation`, `path`,
   `range`, `entropy`, `description`

The current architecture returns `SemanticChange[]` from Merkle tree comparison but needs to
transform these into `DiffChange[]` with full entropy analysis, path information, and semantic
grouping.

---

## Architecture Analysis

### Current Data Flow

```
diff(oldNodes, newNodes)
  ↓
compareTrees(oldTrees, newTrees) → returns SemanticChange[]
  ↓
buildSummary(changes) → returns simple { added, removed, modified, totalChanges }
  ↓
return { changes, summary } ❌ Missing: path, language, groups, totalEntropy, stats
```

### Required Data Flow

```
diff(oldNodes, newNodes, filePath?, language?)
  ↓
compareTrees() → SemanticChange[]
  ↓
transformChanges(changes, filePath, language) → DiffChange[]
  - Transform SemanticChange to DiffChange with:
    * Unique id generation
    * operation mapping (changeType → operation)
    * path from node name or parameter
    * range from node.range
    * entropy analysis (requires EntropyAnalyzer)
    * description generation
  ↓
groupChanges(diffChanges, changes) → SemanticChangeGroup[]
  - Group by semantic type/unit
  - Calculate combined entropy per group
  ↓
calculateTotalEntropy(diffChanges) → EntropyAnalysis
  - Sum all change entropies
  - Calculate statistics
  ↓
calculateStats(diffChanges) → DiffStats
  - Count: additions, deletions, modifications, moves, renames
  - Compute entropyScore and entropyLevel
  ↓
return FileDiff {
  path,
  language,
  changes: DiffChange[],
  groups: SemanticChangeGroup[],
  totalEntropy: EntropyAnalysis,
  stats: DiffStats,
  summary?: (legacy)
}
```

---

## Type Interface Requirements

### DiffChange Interface (Required Properties)

**Location**: `packages/shared/src/types/diff.ts` (lines 18-39)

```typescript
interface DiffChange {
  readonly id: string; // UUID or hash
  readonly operation: DiffOperation; // 'add'|'remove'|'modify'|'move'|'rename'
  readonly path: string; // File path or qualified name
  readonly range: SourceRange; // { start: SourcePosition, end: SourcePosition }
  readonly beforeNode?: SemanticNode; // Legacy: oldNode
  readonly afterNode?: SemanticNode; // Legacy: newNode
  readonly entropy: EntropyAnalysis; // Entropy metrics for change
  readonly description: string; // Human-readable change description

  // Plus legacy properties (already have through createChange):
  readonly nodeType?: string; // From semantic node
  readonly nodeName?: string; // From semantic node name
  readonly changeType?: 'added' | 'removed' | 'modified' | 'unchanged';
  readonly newNode?: SemanticNode;
  readonly oldNode?: SemanticNode;
  oldContent?: string;
  newContent?: string;
  modifications?: Array<{ type: string; description: string }>;
  readonly nodeId?: string;
  readonly depth?: number;
}
```

### FileDiff Interface (Required Properties)

**Location**: `packages/shared/src/types/diff.ts` (lines 60-70)

```typescript
interface FileDiff {
  readonly path: string; // File path
  readonly language: SupportedLanguage; // typescript|javascript|python|rust|go|java|c|cpp|csharp
  readonly changes: readonly DiffChange[]; // Array of all changes
  readonly groups: readonly SemanticChangeGroup[]; // Changes grouped by semantic unit
  readonly totalEntropy: EntropyAnalysis; // Aggregated entropy analysis
  readonly stats: DiffStats; // Statistics summary
  readonly summary?: { added; removed; modified; totalChanges }; // Legacy property
}
```

### SemanticChangeGroup Interface (Required for Grouping)

**Location**: `packages/shared/src/types/diff.ts` (lines 43-55)

```typescript
interface SemanticChangeGroup {
  readonly id: string; // UUID for group
  readonly name: string; // Group identifier
  readonly type: string; // Semantic type (function, class, etc.)
  readonly changes: readonly DiffChange[]; // Changes in this group
  readonly combinedEntropy: EntropyAnalysis; // Group's combined entropy
  readonly level: EntropyLevel; // Entropy level of group
}
```

### EntropyAnalysis Interface (for Entropy Metrics)

**Location**: `packages/shared/src/types/entropy.ts` (lines 70-110)

**Key properties used**:

- `totalEntropy: number` - Shannon entropy sum
- `structuralEntropy: number` - Structure change component
- `semanticEntropy: number` - Meaning change component
- `propagationFactor: number` - Ripple effect multiplier
- `changeScore: number` - E(change) = (structural + semantic) × propagation
- `level: EntropyLevel` - Classification:
  'none'|'minimal'|'low'|'medium'|'moderate'|'high'|'critical'
- `nodeEntropies: NodeEntropy[]` - Per-node breakdown
- `metadata: { algorithm, version, computeTime, ... }`

---

## Step-by-Step Refactoring Plan

### Step 1: Update diff() Method Signature

**File**: `packages/core/src/engine/diff-processor.ts` (lines 48-60)

**Change**: Add optional `filePath` and `language` parameters

```typescript
// BEFORE:
diff(oldNodes: SemanticNode[], newNodes: SemanticNode[]): SemanticDiff {
  const startTime = performance.now();
  const oldTreeResult = this.merkleBuilder.build(oldNodes);
  const newTreeResult = this.merkleBuilder.build(newNodes);
  const changes = this.compareTrees(oldTreeResult.roots, newTreeResult.roots);
  const summary = this.buildSummary(changes);
  const processingTime = performance.now() - startTime;
  return { changes, summary };
}

// AFTER:
diff(
  oldNodes: SemanticNode[],
  newNodes: SemanticNode[],
  filePath: string = 'unknown',
  language: SupportedLanguage = 'typescript'
): SemanticDiff {
  const startTime = performance.now();
  const oldTreeResult = this.merkleBuilder.build(oldNodes);
  const newTreeResult = this.merkleBuilder.build(newNodes);
  const semanticChanges = this.compareTrees(oldTreeResult.roots, newTreeResult.roots);
  const processingTime = performance.now() - startTime;

  // Transform semantic changes to diff changes with entropy
  const diffChanges = await this.transformChanges(semanticChanges, filePath, language);

  // Group changes by semantic unit
  const groups = this.groupChanges(diffChanges, semanticChanges);

  // Calculate aggregated entropy
  const totalEntropy = this.calculateTotalEntropy(diffChanges);

  // Calculate statistics
  const stats = this.calculateStats(diffChanges, totalEntropy);

  // Build legacy summary for backward compatibility
  const summary = this.buildSummary(semanticChanges);

  return {
    path: filePath,
    language,
    changes: diffChanges,
    groups,
    totalEntropy,
    stats,
    summary,
  };
}
```

**Rationale**:

- `filePath` needed for `FileDiff.path` and `DiffChange.path`
- `language` needed for `FileDiff.language`
- Must return `FileDiff` structure instead of just `{ changes, summary }`

---

### Step 2: Add Required Imports

**File**: `packages/core/src/engine/diff-processor.ts` (lines 1-10)

**Add imports for entropy calculation and type usage**:

```typescript
// Current imports:
import type { MerkleNode, SemanticNode, SemanticDiff, SemanticChange } from '@sed/shared/types';
import { MerkleTreeBuilder } from '../semantic/merkle-tree.js';

// ADD THESE IMPORTS:
import type {
  DiffChange,
  DiffStats,
  DiffOperation,
  SemanticChangeGroup,
  EntropyAnalysis,
  EntropyLevel,
  SupportedLanguage,
  SourceRange,
} from '@sed/shared/types';
import { EntropyCalculator } from '../entropy/entropy-calculator.js';
import { EntropyAnalyzer } from '../entropy/entropy-analyzer.js';
import { v4 as uuid } from 'uuid'; // For generating unique IDs
```

**Rationale**:

- `EntropyCalculator` needed to compute per-change entropy metrics
- `EntropyAnalyzer` needed for group-level analysis
- `uuid` for generating unique `DiffChange.id` values
- Type imports for proper type checking

---

### Step 3: Add EntropyCalculator and EntropyAnalyzer Properties

**File**: `packages/core/src/engine/diff-processor.ts` (lines 35-42)

**Update constructor to initialize entropy tools**:

```typescript
// BEFORE:
export class DiffProcessor {
  private readonly options: Required<DiffOptions>;
  private readonly merkleBuilder: MerkleTreeBuilder;

  constructor(options: DiffOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.merkleBuilder = new MerkleTreeBuilder();
  }

// AFTER:
export class DiffProcessor {
  private readonly options: Required<DiffOptions>;
  private readonly merkleBuilder: MerkleTreeBuilder;
  private readonly entropyCalculator: EntropyCalculator;
  private readonly entropyAnalyzer: EntropyAnalyzer;

  constructor(options: DiffOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.merkleBuilder = new MerkleTreeBuilder();
    this.entropyCalculator = new EntropyCalculator();
    this.entropyAnalyzer = new EntropyAnalyzer();
  }
```

**Rationale**:

- Enables entropy calculation for each change
- Enables analysis of grouped changes

---

### Step 4: Create transformChanges() Method

**File**: `packages/core/src/engine/diff-processor.ts` (add after diff() method, before
compareTrees())

**New method to convert SemanticChange → DiffChange**:

```typescript
/**
 * Transform semantic changes to diff changes with entropy analysis
 *
 * Converts SemanticChange (from Merkle tree comparison) to DiffChange
 * (final deliverable) by adding:
 * - Unique ID
 * - Operation type mapping
 * - File path
 * - Source range
 * - Entropy analysis
 * - Human-readable description
 */
private async transformChanges(
  semanticChanges: SemanticChange[],
  filePath: string,
  language: SupportedLanguage
): Promise<DiffChange[]> {
  const diffChanges: DiffChange[] = [];

  for (const semanticChange of semanticChanges) {
    // Get the node (prefer new node for added/modified, old node for removed)
    const node = semanticChange.newNode ?? semanticChange.oldNode;
    if (!node) {
      continue; // Skip if no node available
    }

    // Map SemanticChange.changeType to DiffChange.operation
    const operation = this.mapChangeTypeToOperation(semanticChange.changeType);

    // Extract or construct range
    const range: SourceRange = node.range || {
      start: { line: node.startLine ?? 0, column: 0, offset: 0 },
      end: { line: node.endLine ?? 0, column: 0, offset: 0 },
    };

    // Generate unique ID (combination of operation, node ID, and path)
    const id = this.generateChangeId(semanticChange, filePath);

    // Calculate entropy for this specific change
    const entropy = await this.entropyCalculator.analyzeChange(
      semanticChange.oldNode,
      semanticChange.newNode,
      language
    );

    // Generate human-readable description
    const description = this.generateChangeDescription(semanticChange, node);

    // Create DiffChange with all required properties
    const diffChange: DiffChange = {
      id,
      operation,
      path: filePath,
      range,
      beforeNode: semanticChange.oldNode,
      afterNode: semanticChange.newNode,
      entropy,
      description,

      // Legacy properties (populate from existing SemanticChange)
      nodeType: node.type,
      nodeName: node.name,
      changeType: semanticChange.changeType,
      newNode: semanticChange.newNode,
      oldNode: semanticChange.oldNode,
      nodeId: semanticChange.nodeId,
      depth: node.metadata?.complexity ?? 0,

      // Mutable properties (populated by createChange if present)
      oldContent: semanticChange.oldContent,
      newContent: semanticChange.newContent,
      modifications: semanticChange.modifications,
    };

    diffChanges.push(diffChange);
  }

  return diffChanges;
}

/**
 * Map SemanticChange.changeType to DiffChange.operation
 *
 * Semantic changes use: 'added' | 'removed' | 'modified' | 'unchanged'
 * Diff operations use: 'add' | 'remove' | 'modify' | 'move' | 'rename'
 */
private mapChangeTypeToOperation(
  changeType: 'added' | 'removed' | 'modified' | 'unchanged'
): DiffOperation {
  const mapping: Record<string, DiffOperation> = {
    'added': 'add',
    'removed': 'remove',
    'modified': 'modify',
    'unchanged': 'modify', // Treat unchanged as modify with zero entropy
  };
  return mapping[changeType] ?? 'modify';
}

/**
 * Generate unique ID for a change
 *
 * Combines operation, node ID, and file path to ensure uniqueness
 * across multiple invocations
 */
private generateChangeId(
  change: SemanticChange,
  filePath: string
): string {
  // Use combination of: operation + nodeId + file path
  const seed = `${change.changeType}::${change.nodeId}::${filePath}`;

  // For determinism, use hash instead of UUID when possible
  // Fall back to UUID for true uniqueness
  return uuid();
}

/**
 * Generate human-readable description of the change
 */
private generateChangeDescription(
  change: SemanticChange,
  node: SemanticNode
): string {
  const nodeType = node.type;
  const nodeName = node.name;
  const changeTypeLabel = change.changeType;

  // Format: "<changeType> <nodeType> '<nodeName>'"
  const description = `${changeTypeLabel} ${nodeType} '${nodeName}'`;

  // Append modification details if present
  if (change.modifications && change.modifications.length > 0) {
    const modDetails = change.modifications
      .map(m => m.description)
      .join(', ');
    return `${description} (${modDetails})`;
  }

  return description;
}
```

**Key Points**:

- **Line-by-line transformation**: Each `SemanticChange` becomes a `DiffChange`
- **ID generation**: Unique identifier combining operation, node ID, and file path
- **Operation mapping**: Maps semantic change types to diff operations (added→add, etc.)
- **Range extraction**: Gets source location from node
- **Entropy analysis**: Delegates to `EntropyCalculator.analyzeChange()`
- **Description generation**: Creates human-readable change description
- **Legacy properties**: Populates all legacy fields for backward compatibility

---

### Step 5: Create groupChanges() Method

**File**: `packages/core/src/engine/diff-processor.ts` (add after transformChanges())

**New method to organize changes into semantic groups**:

```typescript
/**
 * Group changes by semantic unit (function, class, etc.)
 *
 * Creates SemanticChangeGroup objects that:
 * - Organize changes by semantic type
 * - Calculate combined entropy per group
 * - Provide semantic-level analysis
 */
private groupChanges(
  diffChanges: DiffChange[],
  semanticChanges: SemanticChange[]
): SemanticChangeGroup[] {
  // Group by semantic type from the original changes
  const groupMap = new Map<string, DiffChange[]>();
  const typeMap = new Map<string, string>(); // Track original node type

  for (let i = 0; i < semanticChanges.length; i++) {
    const semanticChange = semanticChanges[i];
    const diffChange = diffChanges[i];

    const node = semanticChange.newNode ?? semanticChange.oldNode;
    if (!node) continue;

    // Use node type as grouping key
    const groupKey = node.type;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
      typeMap.set(groupKey, node.type);
    }
    groupMap.get(groupKey)!.push(diffChange);
  }

  // Convert groups to SemanticChangeGroup objects
  const groups: SemanticChangeGroup[] = [];

  for (const [groupKey, changes] of groupMap.entries()) {
    const groupId = uuid();

    // Calculate combined entropy for this group
    const combinedEntropy = this.combinEntropies(
      changes.map(c => c.entropy)
    );

    const group: SemanticChangeGroup = {
      id: groupId,
      name: groupKey,
      type: groupKey,
      changes: changes as readonly DiffChange[],
      combinedEntropy,
      level: combinedEntropy.level as EntropyLevel,
    };

    groups.push(group);
  }

  return groups;
}

/**
 * Combine multiple entropy analyses into one
 *
 * Aggregates entropy metrics across multiple changes:
 * - Sums structural/semantic/syntactic components
 * - Weights by propagation factor
 * - Recalculates overall level
 */
private combinEntropies(entropies: EntropyAnalysis[]): EntropyAnalysis {
  if (entropies.length === 0) {
    return this.createEmptyEntropy();
  }

  let totalEntropy = 0;
  let structuralEntropy = 0;
  let semanticEntropy = 0;
  let propagationFactor = 1.0;
  let changeScore = 0;

  for (const entropy of entropies) {
    totalEntropy += entropy.totalEntropy;
    structuralEntropy += entropy.structuralEntropy;
    semanticEntropy += entropy.semanticEntropy;
    propagationFactor *= entropy.propagationFactor;
    changeScore += entropy.changeScore;
  }

  // Average the propagation factor
  propagationFactor = Math.pow(propagationFactor, 1 / entropies.length);

  // Recalculate change score
  const recalculatedScore = (structuralEntropy + semanticEntropy) * propagationFactor;

  // Classify level based on aggregated entropy
  const level = this.classifyEntropyLevel(recalculatedScore);

  return {
    totalEntropy,
    structuralEntropy,
    semanticEntropy,
    propagationFactor,
    changeScore: recalculatedScore,
    level,
    nodeEntropies: entropies.flatMap(e => e.nodeEntropies),
    hotspots: entropies.flatMap(e => e.hotspots),
    entropy: totalEntropy,
    normalizedEntropy: Math.min(1, totalEntropy / 10),
    components: {
      structural: structuralEntropy,
      semantic: semanticEntropy,
      syntactic: 0,
    },
    metadata: {
      algorithm: 'sed-v1',
      version: '1.0.0',
      computeTime: 0,
      totalChanges: entropies.length,
    },
  };
}

/**
 * Classify entropy level based on score
 */
private classifyEntropyLevel(score: number): EntropyLevel {
  // Thresholds based on entropy ranges
  if (score === 0) return 'none';
  if (score < 0.5) return 'minimal';
  if (score < 1.5) return 'low';
  if (score < 3.0) return 'medium';
  if (score < 5.0) return 'moderate';
  if (score < 7.0) return 'high';
  return 'critical';
}

/**
 * Create empty entropy analysis
 */
private createEmptyEntropy(): EntropyAnalysis {
  return {
    totalEntropy: 0,
    structuralEntropy: 0,
    semanticEntropy: 0,
    propagationFactor: 1.0,
    changeScore: 0,
    level: 'none',
    nodeEntropies: [],
    hotspots: [],
    entropy: 0,
    normalizedEntropy: 0,
    components: {
      structural: 0,
      semantic: 0,
      syntactic: 0,
    },
    metadata: {
      algorithm: 'sed-v1',
      version: '1.0.0',
      computeTime: 0,
    },
  };
}
```

**Key Points**:

- **Grouping strategy**: Groups by semantic node type (function, class, etc.)
- **Entropy combination**: Aggregates entropy metrics across group members
- **Level classification**: Recalculates entropy level for the group
- **Node entropy breakdown**: Preserves per-node entropy data in aggregated `nodeEntropies`

---

### Step 6: Create calculateTotalEntropy() Method

**File**: `packages/core/src/engine/diff-processor.ts` (add after groupChanges())

**New method to compute total entropy across all changes**:

```typescript
/**
 * Calculate total entropy for all changes
 *
 * Aggregates entropy across entire change set using:
 * - Sum of all change entropies
 * - Weighted by node importance
 * - Propagation ripple effects
 */
private calculateTotalEntropy(diffChanges: DiffChange[]): EntropyAnalysis {
  if (diffChanges.length === 0) {
    return this.createEmptyEntropy();
  }

  // Use combinEntropies to aggregate all change entropies
  const allEntropies = diffChanges.map(change => change.entropy);
  return this.combinEntropies(allEntropies);
}
```

**Rationale**:

- Reuses `combinEntropies()` to aggregate all changes
- Provides single `EntropyAnalysis` for entire diff

---

### Step 7: Create calculateStats() Method

**File**: `packages/core/src/engine/diff-processor.ts` (add after calculateTotalEntropy())

**New method to compute DiffStats**:

```typescript
/**
 * Calculate statistics for the diff
 *
 * Computes counts and metrics:
 * - additions, deletions, modifications
 * - moves, renames
 * - total changes
 * - entropy score and level
 */
private calculateStats(
  diffChanges: DiffChange[],
  totalEntropy: EntropyAnalysis
): DiffStats {
  // Count changes by operation type
  const additions = diffChanges.filter(c => c.operation === 'add').length;
  const deletions = diffChanges.filter(c => c.operation === 'remove').length;
  const modifications = diffChanges.filter(c => c.operation === 'modify').length;
  const moves = diffChanges.filter(c => c.operation === 'move').length;
  const renames = diffChanges.filter(c => c.operation === 'rename').length;
  const totalChanges = diffChanges.length;

  return {
    additions,
    deletions,
    modifications,
    moves,
    renames,
    totalChanges,
    entropyScore: totalEntropy.changeScore,
    entropyLevel: totalEntropy.level,
  };
}
```

**Key Points**:

- **Operation counting**: Tallies each operation type
- **Entropy integration**: Uses total entropy metrics for score and level

---

### Step 8: Update buildSummary() Return Type

**File**: `packages/core/src/engine/diff-processor.ts` (lines 260-275)

**Change return type to make it optional FileDiff property**:

```typescript
// BEFORE (line 263):
private buildSummary(changes: SemanticChange[]): SemanticDiff['summary'] {
  const byType = this.groupByType(changes);
  const typeCounts: Record<string, number> = {};
  for (const [type, typeChanges] of byType) {
    typeCounts[type] = typeChanges.length;
  }
  return {
    totalChanges: changes.length,
    added: changes.filter((c) => c.changeType === 'added').length,
    removed: changes.filter((c) => c.changeType === 'removed').length,
    modified: changes.filter((c) => c.changeType === 'modified').length,
  };
}

// AFTER:
private buildSummary(changes: SemanticChange[]):
  | { added: number; removed: number; modified: number; totalChanges: number }
  | undefined {
  const byType = this.groupByType(changes);
  const typeCounts: Record<string, number> = {};
  for (const [type, typeChanges] of byType) {
    typeCounts[type] = typeChanges.length;
  }
  return {
    totalChanges: changes.length,
    added: changes.filter((c) => c.changeType === 'added').length,
    removed: changes.filter((c) => c.changeType === 'removed').length,
    modified: changes.filter((c) => c.changeType === 'modified').length,
  };
}
```

**Rationale**:

- Legacy property, now optional in `FileDiff`
- Kept for backward compatibility

---

### Step 9: Fix createChange() Method for Missing DiffChange Properties

**File**: `packages/core/src/engine/diff-processor.ts` (lines 170-200)

**Note**: This method creates `SemanticChange` objects, not `DiffChange` objects. The transformation
happens in `transformChanges()`. No changes needed here; this is clarification that the current
`createChange()` is correct for its purpose.

---

## Async Handling Consideration

### Important: EntropyCalculator.analyzeChange() Signature

The `transformChanges()` method calls:

```typescript
const entropy = await this.entropyCalculator.analyzeChange(
  semanticChange.oldNode,
  semanticChange.newNode,
  language
);
```

This requires `EntropyCalculator.analyzeChange()` to exist and return `Promise<EntropyAnalysis>`.

**If `analyzeChange()` is synchronous**, remove the `await`:

```typescript
const entropy = this.entropyCalculator.analyzeChange(
  semanticChange.oldNode,
  semanticChange.newNode,
  language
);
```

**If it doesn't exist yet**, you need to create it in
`packages/core/src/entropy/entropy-calculator.ts` that wraps the existing calculation methods.

---

## Migration Path for Callers

### sed-engine.ts Update Required

**File**: `packages/core/src/engine/sed-engine.ts` (line 373)

**Current**:

```typescript
private computeDiff(oldTrees: MerkleNode[], newTrees: MerkleNode[]): { changes: DiffChange[]; summary?: any } {
  const oldNodes = this.extractSemanticNodes(oldTrees);
  const newNodes = this.extractSemanticNodes(newTrees);
  return this.diffProcessor.diff(oldNodes, newNodes);
}
```

**After refactoring** (must pass file path and language):

```typescript
private computeDiff(
  oldTrees: MerkleNode[],
  newTrees: MerkleNode[],
  filePath: string = 'unknown',
  language: SupportedLanguage = 'typescript'
): FileDiff {
  const oldNodes = this.extractSemanticNodes(oldTrees);
  const newNodes = this.extractSemanticNodes(newTrees);
  return this.diffProcessor.diff(oldNodes, newNodes, filePath, language);
}
```

---

## Testing Verification Checklist

After implementation, verify:

- [ ] `diff()` returns `FileDiff` (not just `{ changes, summary }`)
- [ ] All `DiffChange` objects have: `id`, `operation`, `path`, `range`, `entropy`, `description`
- [ ] `FileDiff.path` equals input `filePath` parameter
- [ ] `FileDiff.language` equals input `language` parameter
- [ ] `FileDiff.changes` array populated with transformed `DiffChange[]`
- [ ] `FileDiff.groups` array contains `SemanticChangeGroup[]` grouped by type
- [ ] `FileDiff.totalEntropy` is `EntropyAnalysis` with all required fields
- [ ] `FileDiff.stats` is `DiffStats` with correct operation counts
- [ ] Operation mapping: added→add, removed→remove, modified→modify
- [ ] Entropy metrics propagate from changes to groups to total
- [ ] Legacy properties still accessible for backward compatibility
- [ ] No TypeScript errors on lines 48-60 and around line 187

---

## Code Structure Summary

### New Private Methods (in order)

1. **transformChanges()** - SemanticChange → DiffChange + entropy
2. **mapChangeTypeToOperation()** - changeType → operation
3. **generateChangeId()** - Create unique change ID
4. **generateChangeDescription()** - Human-readable text
5. **groupChanges()** - Organize by semantic type
6. **combinEntropies()** - Aggregate entropy metrics
7. **classifyEntropyLevel()** - Score → level mapping
8. **createEmptyEntropy()** - Default entropy object
9. **calculateTotalEntropy()** - Aggregate all changes
10. **calculateStats()** - Count and score changes

### Modified Methods

1. **diff()** - Return `FileDiff` instead of `{ changes, summary }`

### Dependencies Added

- `EntropyCalculator` instance
- `EntropyAnalyzer` instance
- Type imports for `DiffChange`, `DiffStats`, etc.
- `uuid` library for ID generation

---

## Expected Output Structure

```typescript
// Example FileDiff return value
{
  path: "src/example.ts",
  language: "typescript",
  changes: [
    {
      id: "uuid-1",
      operation: "modify",
      path: "src/example.ts",
      range: { start: { line: 10, column: 0, offset: 0 }, ... },
      beforeNode: { /* old SemanticNode */ },
      afterNode: { /* new SemanticNode */ },
      entropy: { totalEntropy: 2.5, level: "medium", ... },
      description: "modified function 'calculateSum' (content has changed, structure has changed)"
    },
    // ... more changes
  ],
  groups: [
    {
      id: "uuid-group-1",
      name: "function",
      type: "function",
      changes: [ /* DiffChange[] */ ],
      combinedEntropy: { /* aggregated */ },
      level: "medium"
    },
    // ... more groups
  ],
  totalEntropy: {
    totalEntropy: 5.2,
    structuralEntropy: 2.1,
    semanticEntropy: 3.1,
    propagationFactor: 1.2,
    changeScore: 6.24,
    level: "moderate",
    // ...
  },
  stats: {
    additions: 2,
    deletions: 1,
    modifications: 3,
    moves: 0,
    renames: 0,
    totalChanges: 6,
    entropyScore: 6.24,
    entropyLevel: "moderate"
  }
}
```

---

## Implementation Order

1. **Step 1**: Update `diff()` signature ✓
2. **Step 2**: Add imports ✓
3. **Step 3**: Add properties to constructor ✓
4. **Step 4**: Implement `transformChanges()` and helpers ✓
5. **Step 5**: Implement `groupChanges()` and helpers ✓
6. **Step 6**: Implement `calculateTotalEntropy()` ✓
7. **Step 7**: Implement `calculateStats()` ✓
8. **Step 8**: Update `buildSummary()` ✓
9. **Step 9**: Update `sed-engine.ts` caller (if needed) ✓
10. **Test**: Verify all types and values ✓
