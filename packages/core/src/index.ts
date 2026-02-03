/**
 * SED - Semantic Entropy Differencing
 * Core Package Public API
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

// Re-export all types from shared
export type {
  // Semantic types
  SupportedLanguage,
  SemanticNodeType,
  SemanticNode,
  MerkleNode,
  SemanticParseResult,
  ParserOptions,
  // Entropy types
  EntropyLevel,
  EntropyAnalysis,
  NodeEntropy,
  EntropyHotspot,
  EntropyThresholds,
  EntropyComparisonResult,
  // Diff types
  DiffChange,
  FileDiff,
  SEDDiffResult,
  DiffSummary,
  DiffOptions,
  // Config types
  SEDConfig,
} from '@sed/shared/types';

// Re-export utilities from shared
export {
  // Hash utilities
  sha256,
  shortHash,
  combineHashes,
  structuralHash,
  contentHash,
  generateId,
  // Entropy math
  shannonEntropy,
  conditionalEntropy,
  klDivergence,
  jsDivergence,
  mutualInformation,
  calculateChangeEntropy,
  normalizeEntropy,
  classifyEntropyLevel,
  // Validation
  detectLanguage,
  validateConfig,
  isValidProbabilityDistribution,
  // Formatting
  formatEntropyBar,
  formatDiffStats,
  formatPath,
  formatDuration,
  COLORS,
} from '@sed/shared/utils';

// Core exports
export { SemanticParser } from './semantic/parser.js';
export { MerkleTreeBuilder } from './semantic/merkle-tree.js';
export { ASTWalker } from './semantic/ast-walker.js';

export { EntropyCalculator } from './entropy/entropy-calculator.js';
export { EntropyAnalyzer } from './entropy/entropy-analyzer.js';
export { PropagationTracker } from './entropy/propagation-tracker.js';

export { SEDEngine } from './engine/sed-engine.js';
export { DiffProcessor } from './engine/diff-processor.js';
export { ChangeClassifier } from './engine/change-classifier.js';

// Version
export const VERSION = '0.0.0';
