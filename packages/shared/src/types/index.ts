/**
 * SED - Semantic Entropy Differencing
 * Core Type Definitions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

export * from './semantic.js';
export * from './entropy.js';
export * from './diff.js';
export * from './config.js';

// Legacy type aliases for backward compatibility
export type { DiffChange as SemanticChange } from './diff.js';
export type { FileDiff as SemanticDiff } from './diff.js';
export type { SEDDiffResult as SEDResult } from './diff.js';
export type { DiffChange as Change } from './diff.js';
export type { SemanticChangeGroup as PropagationPath } from './diff.js';
export type { EntropyAnalysis as PropagationImpact } from './entropy.js';
export type { EntropyAnalysis as EntropyDistribution } from './entropy.js';
export type { EntropyComparison as EntropyComparisonResult } from './entropy.js';
