/**
 * SED - Semantic Entropy Differencing
 * Entropy Calculator - Core Information-Theoretic Engine
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SemanticNode,
  MerkleNode,
  NodeEntropy,
  EntropyThresholds,
  EntropyLevel,
} from '@sed/shared/types';
import { DEFAULT_ENTROPY_THRESHOLDS } from '@sed/shared/types';
import {
  shannonEntropy,
  klDivergence,
  jsDivergence,
  calculateChangeEntropy,
  normalizeEntropy,
  classifyEntropyLevel,
} from '@sed/shared/utils';

/**
 * Distribution type for probability calculations
 */
interface Distribution {
  readonly values: number[];
  readonly labels: string[];
}

/**
 * Result of entropy calculation for a change
 */
interface ChangeEntropyResult {
  /** Structural entropy component */
  readonly structuralEntropy: number;
  /** Semantic entropy component */
  readonly semanticEntropy: number;
  /** Propagation factor */
  readonly propagationFactor: number;
  /** Combined entropy score */
  readonly combinedScore: number;
  /** Normalized score (0-1) */
  readonly normalizedScore: number;
  /** Entropy level classification */
  readonly level: EntropyLevel;
}

/**
 * Options for entropy calculation
 */
interface EntropyOptions {
  thresholds?: EntropyThresholds;
  useSemanticWeights?: boolean;
  propagationDepth?: number;
}

/**
 * Default entropy options
 */
const DEFAULT_OPTIONS: Required<EntropyOptions> = {
  thresholds: DEFAULT_ENTROPY_THRESHOLDS,
  useSemanticWeights: true,
  propagationDepth: 3,
};

/**
 * Semantic weight factors for different node types
 */
const SEMANTIC_WEIGHTS: Record<string, number> = {
  function: 1.5,
  class: 2.0,
  interface: 1.8,
  type: 1.3,
  variable: 0.8,
  import: 0.5,
  export: 1.0,
  module: 2.5,
  other: 1.0,
};

/**
 * Entropy Calculator
 *
 * Computes information-theoretic entropy metrics for code changes using:
 * - Shannon Entropy: H(X) = -Σᵢ p(xᵢ) × log₂(p(xᵢ))
 * - KL Divergence: D_KL(P || Q) = Σᵢ P(i) × log₂(P(i) / Q(i))
 * - JS Divergence: Symmetric version of KL
 * - Change Entropy: E(change) = (E_structural + E_semantic) × PropagationFactor
 */
export class EntropyCalculator {
  private readonly options: Required<EntropyOptions>;

  constructor(options: EntropyOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Calculate entropy for a single node change
   */
  calculateNodeEntropy(oldNode: MerkleNode | null, newNode: MerkleNode | null): NodeEntropy {
    const node = newNode ?? oldNode;
    if (!node) {
      throw new Error('At least one node must be provided');
    }

    const changeType = this.determineChangeType(oldNode, newNode);
    const result = this.computeChangeEntropy(oldNode, newNode, changeType);

    // Determine entropy change type from semantic/structural split
    const entropyChangeType:
      | 'structural'
      | 'semantic'
      | 'added'
      | 'removed'
      | 'modified'
      | 'unchanged'
      | 'multiple' =
      result.structuralEntropy > 0 && result.semanticEntropy > 0
        ? 'multiple'
        : result.structuralEntropy > result.semanticEntropy
          ? 'structural'
          : result.semanticEntropy > 0
            ? 'semantic'
            : changeType === 'added'
              ? 'added'
              : changeType === 'removed'
                ? 'removed'
                : changeType === 'modified'
                  ? 'modified'
                  : 'unchanged';

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      shannon: result.combinedScore,
      conditional: result.semanticEntropy,
      relative: result.normalizedScore,
      entropy: result.combinedScore,
      normalizedEntropy: result.normalizedScore,
      level: result.level,
      type: entropyChangeType,
      components: {
        structural: result.structuralEntropy,
        semantic: result.semanticEntropy,
        syntactic: 0,
      },
      changeType,
    };
  }

  /**
   * Calculate entropy for multiple node changes
   */
  calculateBatchEntropy(
    changes: Array<{ old: MerkleNode | null; new: MerkleNode | null }>
  ): NodeEntropy[] {
    return changes.map(({ old, new: newNode }) => this.calculateNodeEntropy(old, newNode));
  }

  /**
   * Calculate total entropy for a set of changes
   */
  calculateTotalEntropy(nodeEntropies: NodeEntropy[]): number {
    if (nodeEntropies.length === 0) {
      return 0;
    }

    // Sum of individual entropies with diminishing returns
    let total = 0;
    const sorted = [...nodeEntropies].sort((a, b) => b.entropy - a.entropy);

    for (let i = 0; i < sorted.length; i++) {
      // Diminishing factor: 1, 0.9, 0.81, 0.729, ...
      const diminishingFactor = Math.pow(0.9, i);
      total += sorted[i]!.entropy * diminishingFactor;
    }

    return total;
  }

  /**
   * Calculate distribution entropy (Shannon entropy)
   */
  calculateDistributionEntropy(distribution: Distribution): number {
    const total = distribution.values.reduce((sum, v) => sum + v, 0);
    if (total === 0) {
      return 0;
    }

    const probabilities = distribution.values.map((v) => v / total);
    return shannonEntropy(probabilities);
  }

  /**
   * Calculate divergence between two distributions
   */
  calculateDivergence(
    oldDistribution: Distribution,
    newDistribution: Distribution,
    symmetric = true
  ): number {
    // Normalize distributions
    const oldTotal = oldDistribution.values.reduce((sum, v) => sum + v, 0);
    const newTotal = newDistribution.values.reduce((sum, v) => sum + v, 0);

    if (oldTotal === 0 || newTotal === 0) {
      return 0;
    }

    const oldProbs = oldDistribution.values.map((v) => v / oldTotal);
    const newProbs = newDistribution.values.map((v) => v / newTotal);

    // Align distributions (handle different lengths)
    const aligned = this.alignDistributions(
      oldProbs,
      newProbs,
      oldDistribution.labels,
      newDistribution.labels
    );

    if (symmetric) {
      return jsDivergence(aligned.p, aligned.q);
    } else {
      return klDivergence(aligned.p, aligned.q);
    }
  }

  /**
   * Get semantic weight for a node type
   */
  getSemanticWeight(nodeType: string): number {
    return this.options.useSemanticWeights
      ? (SEMANTIC_WEIGHTS[nodeType] ?? SEMANTIC_WEIGHTS['other']!)
      : 1.0;
  }

  /**
   * Classify an entropy value
   */
  classify(entropy: number): EntropyLevel {
    return classifyEntropyLevel(entropy, this.options.thresholds);
  }

  // Private methods

  /**
   * Determine the type of change
   */
  private determineChangeType(
    oldNode: MerkleNode | null,
    newNode: MerkleNode | null
  ): 'added' | 'removed' | 'modified' | 'unchanged' {
    if (!oldNode && newNode) {
      return 'added';
    }
    if (oldNode && !newNode) {
      return 'removed';
    }
    if (oldNode && newNode && oldNode.merkleHash !== newNode.merkleHash) {
      return 'modified';
    }
    return 'unchanged';
  }

  /**
   * Compute entropy for a change
   */
  private computeChangeEntropy(
    oldNode: MerkleNode | null,
    newNode: MerkleNode | null,
    changeType: 'added' | 'removed' | 'modified' | 'unchanged'
  ): ChangeEntropyResult {
    const node = newNode ?? oldNode!;

    if (changeType === 'unchanged') {
      return {
        structuralEntropy: 0,
        semanticEntropy: 0,
        propagationFactor: 1,
        combinedScore: 0,
        normalizedScore: 0,
        level: 'minimal',
      };
    }

    // Calculate structural entropy
    const structuralEntropy = this.computeStructuralEntropy(oldNode, newNode, changeType);

    // Calculate semantic entropy
    const semanticEntropy = this.computeSemanticEntropy(oldNode, newNode, changeType);

    // Calculate propagation factor
    const propagationFactor = this.computePropagationFactor(node, changeType);

    // Combined score using the Change Entropy formula
    // Calculate using absolute propagation factor for always-positive entropy
    const combinedScore = calculateChangeEntropy(
      structuralEntropy,
      semanticEntropy,
      Math.abs(propagationFactor)
    );

    // Normalize to 0-1 range using a reasonable maximum
    // Use depth and children count to estimate complexity
    // Higher minimum for more conservative normalization (prevents over-classification)
    const complexityFactor = Math.max(1, node.depth + node.children.length / 2);
    const maxCategories = Math.max(16, Math.ceil(complexityFactor * 6));
    const normalizedScore = normalizeEntropy(combinedScore, maxCategories);

    // Classify level
    const level = classifyEntropyLevel(normalizedScore, this.options.thresholds);

    return {
      structuralEntropy,
      semanticEntropy,
      propagationFactor,
      combinedScore,
      normalizedScore,
      level,
    };
  }

  /**
   * Compute structural entropy component
   */
  private computeStructuralEntropy(
    oldNode: MerkleNode | null,
    newNode: MerkleNode | null,
    changeType: 'added' | 'removed' | 'modified' | 'unchanged'
  ): number {
    const node = newNode ?? oldNode!;

    switch (changeType) {
      case 'added': {
        // New structure adds information based on complexity
        const complexity = this.calculateNodeComplexity(node);
        return Math.log2(1 + complexity);
      }

      case 'removed': {
        // Removal entropy based on what was lost
        const complexity = this.calculateNodeComplexity(node);
        return Math.log2(1 + complexity) * 0.8; // Slightly less than addition
      }

      case 'modified': {
        // Modification entropy based on structural difference
        if (oldNode && newNode) {
          const oldComplexity = this.calculateNodeComplexity(oldNode);
          const newComplexity = this.calculateNodeComplexity(newNode);
          const complexityDelta = Math.abs(newComplexity - oldComplexity);
          return Math.log2(1 + complexityDelta);
        }
        return 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Compute semantic entropy component
   */
  private computeSemanticEntropy(
    oldNode: MerkleNode | null,
    newNode: MerkleNode | null,
    changeType: 'added' | 'removed' | 'modified' | 'unchanged'
  ): number {
    const node = newNode ?? oldNode!;
    const semanticWeight = this.getSemanticWeight(node.type);

    switch (changeType) {
      case 'added':
        // New semantic unit contributes its full weight
        return semanticWeight;

      case 'removed':
        // Removal affects semantic structure
        return semanticWeight * 0.9;

      case 'modified': {
        // Modification entropy depends on content change
        if (oldNode && newNode) {
          const contentChanged = oldNode.contentHash !== newNode.contentHash;
          const structureChanged = oldNode.structuralHash !== newNode.structuralHash;

          if (contentChanged && structureChanged) {
            return semanticWeight * 1.2; // Significant change
          } else if (contentChanged) {
            return semanticWeight * 0.8; // Content-only change
          } else {
            return semanticWeight * 0.4; // Structure-only change
          }
        }
        return semanticWeight * 0.5;
      }

      default:
        return 0;
    }
  }

  /**
   * Compute propagation factor based on node's potential impact
   */
  private computePropagationFactor(
    node: MerkleNode,
    changeType: 'added' | 'removed' | 'modified' | 'unchanged'
  ): number {
    if (changeType === 'unchanged') {
      return 1;
    }

    // Base propagation on depth and children
    const depthFactor = 1 + node.depth * 0.1;
    const childrenFactor = 1 + node.children.length * 0.2;
    const typeFactor = this.getTypePropagationFactor(node.type);

    const factor = depthFactor * childrenFactor * typeFactor;

    // Removed nodes have negative propagation (reduced impact)
    return changeType === 'removed' ? -factor : factor;
  }

  /**
   * Get propagation factor for a node type
   */
  private getTypePropagationFactor(nodeType: string): number {
    const factors: Record<string, number> = {
      interface: 1.5, // Changes propagate to implementations
      type: 1.4, // Type changes affect usage
      class: 1.3,
      function: 1.1,
      variable: 1.0,
      import: 0.8,
      export: 1.2,
      module: 1.6,
    };

    return factors[nodeType] ?? 1.0;
  }

  /**
   * Calculate node complexity metric
   */
  private calculateNodeComplexity(node: MerkleNode): number {
    let complexity = 1;

    // Add depth contribution
    complexity += node.depth * 0.5;

    // Add children contribution
    complexity += node.children.length;

    // Recursively add children complexity (with diminishing factor)
    for (const child of node.children) {
      complexity += this.calculateNodeComplexity(child) * 0.5;
    }

    return complexity;
  }

  /**
   * Align two probability distributions for comparison
   */
  private alignDistributions(
    p: number[],
    q: number[],
    pLabels: string[],
    qLabels: string[]
  ): { p: number[]; q: number[] } {
    // Create a union of all labels
    const allLabels = new Set([...pLabels, ...qLabels]);
    const pMap = new Map(pLabels.map((l, i) => [l, p[i]!]));
    const qMap = new Map(qLabels.map((l, i) => [l, q[i]!]));

    const alignedP: number[] = [];
    const alignedQ: number[] = [];

    // Small epsilon to avoid zeros
    const epsilon = 1e-10;

    for (const label of allLabels) {
      alignedP.push(pMap.get(label) ?? epsilon);
      alignedQ.push(qMap.get(label) ?? epsilon);
    }

    // Re-normalize
    const pSum = alignedP.reduce((a, b) => a + b, 0);
    const qSum = alignedQ.reduce((a, b) => a + b, 0);

    return {
      p: alignedP.map((v) => v / pSum),
      q: alignedQ.map((v) => v / qSum),
    };
  }
}
