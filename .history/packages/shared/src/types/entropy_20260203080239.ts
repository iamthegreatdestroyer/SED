/**
 * SED - Semantic Entropy Differencing
 * Entropy Calculation Types
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 * 
 * Mathematical Foundations:
 * - Shannon Entropy: H(X) = -Σᵢ p(xᵢ) × log₂(p(xᵢ))
 * - Conditional Entropy: H(Y|X) = Σₓ p(x) × H(Y|X=x)
 * - KL Divergence: D_KL(P || Q) = Σᵢ P(i) × log₂(P(i) / Q(i))
 * - Change Entropy Score: E(change) = (E_structural + E_semantic) × PropagationFactor
 */

/**
 * Entropy change classification levels
 */
export type EntropyLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Types of entropy changes
 */
export type EntropyChangeType =
  | 'structural'    // Changes to code structure (blocks, nesting)
  | 'semantic'      // Changes to meaning (function logic, types)
  | 'syntactic'     // Surface-level changes (formatting, names)
  | 'propagation'   // Changes that affect other parts of codebase
  | 'mixed';        // Combination of multiple types

/**
 * Entropy calculation result for a single node
 */
export interface NodeEntropy {
  readonly nodeId: string;
  readonly shannon: number;           // Shannon entropy value
  readonly conditional: number;       // Conditional entropy given context
  readonly relative: number;          // Relative to baseline (0-1)
  readonly level: EntropyLevel;       // Classified level
  readonly type: EntropyChangeType;   // Type of change
}

/**
 * Complete entropy analysis result
 */
export interface EntropyAnalysis {
  readonly totalEntropy: number;
  readonly structuralEntropy: number;
  readonly semanticEntropy: number;
  readonly propagationFactor: number;
  readonly changeScore: number;       // E(change) = (structural + semantic) × propagation
  readonly level: EntropyLevel;
  readonly nodeEntropies: readonly NodeEntropy[];
  readonly hotspots: readonly EntropyHotspot[];
}

/**
 * High entropy areas requiring attention
 */
export interface EntropyHotspot {
  readonly nodeId: string;
  readonly entropy: number;
  readonly reason: string;
  readonly suggestedReview: boolean;
  readonly affectedNodes: readonly string[];
}

/**
 * Entropy thresholds configuration
 */
export interface EntropyThresholds {
  readonly minimal: number;   // < 0.1
  readonly low: number;       // < 0.3
  readonly moderate: number;  // < 0.6
  readonly high: number;      // < 0.8
  readonly critical: number;  // >= 0.8
}

/**
 * Default entropy thresholds
 */
export const DEFAULT_ENTROPY_THRESHOLDS: EntropyThresholds = {
  minimal: 0.1,
  low: 0.3,
  moderate: 0.6,
  high: 0.8,
  critical: 1.0,
} as const;

/**
 * Probability distribution for entropy calculation
 */
export interface ProbabilityDistribution {
  readonly values: ReadonlyMap<string, number>;
  readonly total: number;
  readonly entropy: number;
}

/**
 * Entropy comparison between two states
 */
export interface EntropyComparison {
  readonly before: EntropyAnalysis;
  readonly after: EntropyAnalysis;
  readonly delta: number;
  readonly klDivergence: number;      // D_KL(P || Q)
  readonly significanceLevel: EntropyLevel;
}
