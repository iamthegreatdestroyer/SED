/**
 * SED - Semantic Entropy Differencing
 * Entropy Mathematical Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 * 
 * Mathematical Foundations:
 * - Shannon Entropy: H(X) = -Σᵢ p(xᵢ) × log₂(p(xᵢ))
 * - Conditional Entropy: H(Y|X) = Σₓ p(x) × H(Y|X=x)
 * - KL Divergence: D_KL(P || Q) = Σᵢ P(i) × log₂(P(i) / Q(i))
 * - Joint Entropy: H(X,Y) = -Σᵢⱼ p(xᵢ,yⱼ) × log₂(p(xᵢ,yⱼ))
 * - Mutual Information: I(X;Y) = H(X) + H(Y) - H(X,Y)
 */

import type { EntropyLevel, EntropyThresholds, DEFAULT_ENTROPY_THRESHOLDS } from '../types/entropy.js';

/**
 * Base-2 logarithm, returns 0 for 0 input (convention in information theory)
 */
export function log2(x: number): number {
  if (x <= 0) return 0;
  return Math.log2(x);
}

/**
 * Calculate Shannon entropy from a probability distribution
 * H(X) = -Σᵢ p(xᵢ) × log₂(p(xᵢ))
 */
export function shannonEntropy(probabilities: readonly number[]): number {
  if (probabilities.length === 0) return 0;
  
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0 && p <= 1) {
      entropy -= p * log2(p);
    }
  }
  
  return entropy;
}

/**
 * Calculate Shannon entropy from frequency counts
 */
export function shannonEntropyFromCounts(counts: readonly number[]): number {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0;
  
  const probabilities = counts.map(c => c / total);
  return shannonEntropy(probabilities);
}

/**
 * Calculate conditional entropy H(Y|X)
 * H(Y|X) = Σₓ p(x) × H(Y|X=x)
 */
export function conditionalEntropy(
  jointProbabilities: ReadonlyMap<string, ReadonlyMap<string, number>>,
  xProbabilities: ReadonlyMap<string, number>
): number {
  let entropy = 0;
  
  for (const [x, pX] of xProbabilities) {
    const conditionalDist = jointProbabilities.get(x);
    if (conditionalDist && pX > 0) {
      const condProbs = Array.from(conditionalDist.values());
      const condTotal = condProbs.reduce((sum, p) => sum + p, 0);
      if (condTotal > 0) {
        const normalizedCondProbs = condProbs.map(p => p / condTotal);
        entropy += pX * shannonEntropy(normalizedCondProbs);
      }
    }
  }
  
  return entropy;
}

/**
 * Calculate Kullback-Leibler divergence D_KL(P || Q)
 * D_KL(P || Q) = Σᵢ P(i) × log₂(P(i) / Q(i))
 * 
 * Note: Returns Infinity if Q(i) = 0 where P(i) > 0
 */
export function klDivergence(
  p: readonly number[],
  q: readonly number[]
): number {
  if (p.length !== q.length) {
    throw new Error('Distributions must have same length');
  }
  
  let divergence = 0;
  for (let i = 0; i < p.length; i++) {
    const pI = p[i]!;
    const qI = q[i]!;
    
    if (pI > 0) {
      if (qI === 0) {
        return Infinity;
      }
      divergence += pI * log2(pI / qI);
    }
  }
  
  return divergence;
}

/**
 * Calculate Jensen-Shannon divergence (symmetric version of KL)
 * JSD(P || Q) = 0.5 × D_KL(P || M) + 0.5 × D_KL(Q || M)
 * where M = 0.5 × (P + Q)
 */
export function jsDivergence(
  p: readonly number[],
  q: readonly number[]
): number {
  if (p.length !== q.length) {
    throw new Error('Distributions must have same length');
  }
  
  const m = p.map((pI, i) => 0.5 * (pI + (q[i] ?? 0)));
  return 0.5 * klDivergence(p, m) + 0.5 * klDivergence(q, m);
}

/**
 * Calculate mutual information I(X;Y) = H(X) + H(Y) - H(X,Y)
 */
export function mutualInformation(
  xProbs: readonly number[],
  yProbs: readonly number[],
  jointProbs: readonly number[][]
): number {
  const hX = shannonEntropy(xProbs);
  const hY = shannonEntropy(yProbs);
  const hXY = shannonEntropy(jointProbs.flat());
  
  return hX + hY - hXY;
}

/**
 * Normalize entropy to [0, 1] range based on maximum possible entropy
 */
export function normalizeEntropy(entropy: number, maxCategories: number): number {
  if (maxCategories <= 1) return 0;
  const maxEntropy = log2(maxCategories);
  if (maxEntropy === 0) return 0;
  return Math.min(1, entropy / maxEntropy);
}

/**
 * Classify entropy value into a level
 */
export function classifyEntropyLevel(
  normalizedEntropy: number,
  thresholds: EntropyThresholds = {
    minimal: 0.1,
    low: 0.3,
    moderate: 0.6,
    high: 0.8,
    critical: 1.0,
  }
): EntropyLevel {
  if (normalizedEntropy < thresholds.minimal) return 'minimal';
  if (normalizedEntropy < thresholds.low) return 'low';
  if (normalizedEntropy < thresholds.moderate) return 'moderate';
  if (normalizedEntropy < thresholds.high) return 'high';
  return 'critical';
}

/**
 * Calculate propagation factor based on affected nodes
 */
export function calculatePropagationFactor(
  affectedNodes: number,
  totalNodes: number
): number {
  if (totalNodes === 0) return 1;
  // Base factor of 1, increases logarithmically with spread
  return 1 + log2(1 + affectedNodes / totalNodes);
}

/**
 * Calculate change entropy score
 * E(change) = (E_structural + E_semantic) × PropagationFactor
 */
export function calculateChangeEntropy(
  structuralEntropy: number,
  semanticEntropy: number,
  propagationFactor: number,
  structuralWeight = 0.4,
  semanticWeight = 0.6
): number {
  const baseEntropy = 
    structuralWeight * structuralEntropy + 
    semanticWeight * semanticEntropy;
  
  return baseEntropy * propagationFactor;
}

/**
 * Calculate entropy delta between two states
 */
export function entropyDelta(before: number, after: number): number {
  return after - before;
}

/**
 * Determine if entropy change is significant
 */
export function isSignificantChange(
  delta: number,
  threshold = 0.1
): boolean {
  return Math.abs(delta) >= threshold;
}
