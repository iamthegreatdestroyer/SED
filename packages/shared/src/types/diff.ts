/**
 * SED - Semantic Entropy Differencing
 * Diff Result Types
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { EntropyAnalysis, EntropyLevel } from './entropy.js';
import type { SemanticNode, SourceRange, SupportedLanguage } from './semantic.js';

/**
 * Types of diff operations
 */
export type DiffOperation = 'add' | 'remove' | 'modify' | 'move' | 'rename';

/**
 * A single change in the diff
 */
export interface DiffChange {
  readonly id: string;
  readonly operation: DiffOperation;
  readonly path: string;
  readonly range: SourceRange;
  readonly beforeNode?: SemanticNode;
  readonly afterNode?: SemanticNode;
  readonly entropy: EntropyAnalysis;
  readonly description: string;

  // Legacy properties for backward compatibility
  readonly nodeType?: string;
  readonly nodeName?: string;
  readonly changeType?: 'added' | 'removed' | 'modified' | 'unchanged';
  readonly newNode?: SemanticNode;
  readonly oldNode?: SemanticNode;
  oldContent?: string; // Mutable for assignment after creation
  newContent?: string; // Mutable for assignment after creation
  modifications?: Array<{ type: string; description: string }>; // Mutable for assignment after creation
  readonly nodeId?: string;
  readonly depth?: number;
}

/**
 * Grouped changes by semantic unit
 */
export interface SemanticChangeGroup {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly changes: readonly DiffChange[];
  readonly combinedEntropy: EntropyAnalysis;
  readonly level: EntropyLevel;

  // Legacy properties for backward compatibility
  readonly source?: string;
  readonly targets?: readonly string[];
}

/**
 * File-level diff result
 */
export interface FileDiff {
  readonly path: string;
  readonly language: SupportedLanguage;
  readonly changes: readonly DiffChange[];
  readonly groups: readonly SemanticChangeGroup[];
  readonly totalEntropy: EntropyAnalysis;
  readonly stats: DiffStats;

  // Legacy property for backward compatibility
  readonly summary?: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
    readonly totalChanges: number;
  };
}

/**
 * Statistics for a diff
 */
export interface DiffStats {
  readonly additions: number;
  readonly deletions: number;
  readonly modifications: number;
  readonly moves: number;
  readonly renames: number;
  readonly totalChanges: number;
  readonly entropyScore: number;
  readonly entropyLevel: EntropyLevel;
}

/**
 * Complete SED diff result
 */
export interface SEDDiffResult {
  readonly files: readonly FileDiff[];
  readonly summary: DiffSummary;
  readonly metadata: DiffMetadata;

  // Legacy properties for backward compatibility
  readonly analysis?: EntropyAnalysis;
  readonly diff?: FileDiff;
  readonly classifications?: ReadonlyArray<{ change: DiffChange; [key: string]: any }>;
}

/**
 * Summary of all diffs
 */
export interface DiffSummary {
  readonly totalFiles: number;
  readonly totalChanges: number;
  readonly overallEntropy: EntropyAnalysis;
  readonly hotspots: readonly string[];
  readonly stats: DiffStats;
  readonly riskLevel: EntropyLevel;

  // Legacy properties for backward compatibility
  readonly processingTime?: number;
  readonly averageRiskScore?: number;
}

/**
 * Metadata about the diff operation
 */
export interface DiffMetadata {
  readonly version: string;
  readonly timestamp: string;
  readonly beforeRef?: string;
  readonly afterRef?: string;
  readonly computeTime: number;
  readonly algorithm: 'sed-v1';

  // Legacy properties for backward compatibility
  readonly oldFile?: string;
  readonly newFile?: string;
}

/**
 * Options for diff computation
 */
export interface DiffOptions {
  readonly includeComments?: boolean;
  readonly includeWhitespace?: boolean;
  readonly maxDepth?: number;
  readonly entropyThreshold?: number;
  readonly groupBySemanticUnit?: boolean;
  readonly detectMoves?: boolean;
  readonly detectRenames?: boolean;
}

/**
 * Default diff options
 */
export const DEFAULT_DIFF_OPTIONS: Required<DiffOptions> = {
  includeComments: true,
  includeWhitespace: false,
  maxDepth: Infinity,
  entropyThreshold: 0,
  groupBySemanticUnit: true,
  detectMoves: true,
  detectRenames: true,
} as const;

/**
 * Diff output format
 */
export type DiffOutputFormat = 'json' | 'text' | 'html' | 'unified' | 'side-by-side';

/**
 * Formatted diff output
 */
export interface FormattedDiff {
  readonly format: DiffOutputFormat;
  readonly content: string;
  readonly result: SEDDiffResult;
}
