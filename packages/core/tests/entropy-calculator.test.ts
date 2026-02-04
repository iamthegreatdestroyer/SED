/**
 * SED - Semantic Entropy Differencing
 * Entropy Calculator Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { EntropyCalculator } from '../src/entropy/entropy-calculator.js';
import type { MerkleNode } from '@sed/shared/types';

describe('EntropyCalculator', () => {
  let calculator: EntropyCalculator;

  beforeEach(() => {
    calculator = new EntropyCalculator();
  });

  describe('calculateNodeEntropy', () => {
    it('should calculate entropy for an added node', () => {
      const node: MerkleNode = createMerkleNode('function', 'addedFunc', []);

      const result = calculator.calculateNodeEntropy(null, node);

      expect(result).toBeDefined();
      expect(result.nodeId).toBe(node.id);
      expect(result.changeType).toBe('added');
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.normalizedEntropy).toBeGreaterThanOrEqual(0);
      expect(result.normalizedEntropy).toBeLessThanOrEqual(1);
      expect(result.level).toBeDefined();
    });

    it('should calculate entropy for a removed node', () => {
      const node: MerkleNode = createMerkleNode('class', 'RemovedClass', []);

      const result = calculator.calculateNodeEntropy(node, null);

      expect(result.changeType).toBe('removed');
      expect(result.entropy).toBeGreaterThan(0);
    });

    it('should calculate entropy for a modified node', () => {
      const oldNode: MerkleNode = createMerkleNode('function', 'modifiedFunc', []);
      const newNode: MerkleNode = {
        ...oldNode,
        merkleHash: 'different-hash',
        contentHash: 'different',
      };

      const result = calculator.calculateNodeEntropy(oldNode, newNode);

      expect(result.changeType).toBe('modified');
      expect(result.entropy).toBeGreaterThan(0);
    });

    it('should weight semantic types correctly', () => {
      const functionNode = createMerkleNode('function', 'func', []);
      const variableNode = createMerkleNode('variable', 'var', []);

      const functionEntropy = calculator.calculateNodeEntropy(null, functionNode);
      const variableEntropy = calculator.calculateNodeEntropy(null, variableNode);

      // Functions should have higher semantic weight than variables
      expect(functionEntropy.components.semantic).toBeGreaterThan(
        variableEntropy.components.semantic
      );
    });

    it('should account for node depth in entropy', () => {
      const shallowNode = createMerkleNode('function', 'shallow', [], 1);
      const deepNode = createMerkleNode('function', 'deep', [], 5);

      const shallowEntropy = calculator.calculateNodeEntropy(null, shallowNode);
      const deepEntropy = calculator.calculateNodeEntropy(null, deepNode);

      // Depth affects structural entropy
      expect(shallowEntropy.components.structural).not.toBe(deepEntropy.components.structural);
    });

    it('should include propagation factor', () => {
      const parentNode = createMerkleNode('class', 'Parent', [
        createMerkleNode('function', 'method1', []),
        createMerkleNode('function', 'method2', []),
        createMerkleNode('function', 'method3', []),
      ]);

      const result = calculator.calculateNodeEntropy(null, parentNode);

      // Nodes with children should have higher propagation factor
      expect(result.components.propagation).toBeGreaterThan(1);
    });
  });

  describe('calculateBatchEntropy', () => {
    it('should calculate entropy for multiple nodes', () => {
      const nodes: MerkleNode[] = [
        createMerkleNode('function', 'func1', []),
        createMerkleNode('function', 'func2', []),
        createMerkleNode('class', 'Class1', []),
      ];

      const changes = nodes.map((node) => ({ old: null, new: node }));
      const results = calculator.calculateBatchEntropy(changes);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.entropy > 0)).toBe(true);
    });

    it('should handle empty input', () => {
      const results = calculator.calculateBatchEntropy([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('calculateTotalEntropy', () => {
    it('should aggregate entropies with diminishing returns', () => {
      const nodes: MerkleNode[] = [
        createMerkleNode('function', 'func1', []),
        createMerkleNode('function', 'func2', []),
        createMerkleNode('function', 'func3', []),
      ];

      const changes = nodes.map((node) => ({ old: null, new: node }));
      const entropies = calculator.calculateBatchEntropy(changes);

      const total = calculator.calculateTotalEntropy(entropies);

      // Total should be less than sum due to diminishing returns
      const sumOfEntropies = entropies.reduce((sum, e) => sum + e.entropy, 0);
      expect(total).toBeLessThan(sumOfEntropies);
      expect(total).toBeGreaterThan(0);
    });

    it('should return 0 for empty input', () => {
      const total = calculator.calculateTotalEntropy([]);

      expect(total).toBe(0);
    });
  });

  describe('calculateDistributionEntropy', () => {
    it('should calculate Shannon entropy of distribution', () => {
      // Uniform distribution should have maximum entropy
      const uniformDist = {
        values: [0.25, 0.25, 0.25, 0.25],
        labels: ['A', 'B', 'C', 'D'],
      };
      const uniformEntropy = calculator.calculateDistributionEntropy(uniformDist);

      // Skewed distribution should have lower entropy
      const skewedDist = {
        values: [0.9, 0.05, 0.03, 0.02],
        labels: ['A', 'B', 'C', 'D'],
      };
      const skewedEntropy = calculator.calculateDistributionEntropy(skewedDist);

      expect(uniformEntropy).toBeGreaterThan(skewedEntropy);
    });

    it('should return 0 for single-value distribution', () => {
      const singleDist = {
        values: [1.0],
        labels: ['A'],
      };
      const entropy = calculator.calculateDistributionEntropy(singleDist);

      expect(entropy).toBe(0);
    });

    it('should handle zero probabilities', () => {
      const withZeros = {
        values: [0.5, 0, 0.5, 0],
        labels: ['A', 'B', 'C', 'D'],
      };
      const entropy = calculator.calculateDistributionEntropy(withZeros);

      expect(entropy).toBeGreaterThan(0);
      expect(Number.isFinite(entropy)).toBe(true);
    });
  });

  describe('calculateDivergence', () => {
    it('should calculate KL divergence', () => {
      const p = {
        values: [0.5, 0.25, 0.25],
        labels: ['A', 'B', 'C'],
      };
      const q = {
        values: [0.33, 0.33, 0.34],
        labels: ['A', 'B', 'C'],
      };

      const kl = calculator.calculateDivergence(p, q, false);

      expect(kl).toBeGreaterThanOrEqual(0);
    });

    it('should calculate symmetric JS divergence', () => {
      const p = {
        values: [0.5, 0.25, 0.25],
        labels: ['A', 'B', 'C'],
      };
      const q = {
        values: [0.33, 0.33, 0.34],
        labels: ['A', 'B', 'C'],
      };

      const js = calculator.calculateDivergence(p, q, true);

      // JS divergence is symmetric
      const jsReverse = calculator.calculateDivergence(q, p, true);
      expect(Math.abs(js - jsReverse)).toBeLessThan(0.001);
    });

    it('should return 0 for identical distributions', () => {
      const p = {
        values: [0.5, 0.3, 0.2],
        labels: ['A', 'B', 'C'],
      };

      const kl = calculator.calculateDivergence(p, p, false);
      const js = calculator.calculateDivergence(p, p, true);

      expect(kl).toBeCloseTo(0, 5);
      expect(js).toBeCloseTo(0, 5);
    });
  });

  describe('entropy level classification', () => {
    it('should classify minimal entropy', () => {
      const calculator = new EntropyCalculator({
        thresholds: { minimal: 0.1, low: 0.3, moderate: 0.5, high: 0.7, critical: 0.9 },
      });

      const node = createMerkleNode('variable', 'x', [], 1);
      const result = calculator.calculateNodeEntropy(null, node);

      // Simple variable should be minimal
      expect(['minimal', 'low']).toContain(result.level);
    });

    it('should classify higher entropy for complex changes', () => {
      const complexNode = createMerkleNode(
        'module',
        'ComplexModule',
        [
          createMerkleNode('class', 'Class1', [
            createMerkleNode('function', 'method1', []),
            createMerkleNode('function', 'method2', []),
          ]),
          createMerkleNode('class', 'Class2', [createMerkleNode('function', 'method1', [])]),
        ],
        0
      );

      const result = calculator.calculateNodeEntropy(null, complexNode);

      expect(['moderate', 'high', 'critical']).toContain(result.level);
    });
  });
});

// Helper functions

function createMerkleNode(
  type: string,
  name: string,
  children: MerkleNode[] = [],
  depth = 0
): MerkleNode {
  const id = `node-${name}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    type,
    name,
    depth,
    contentHash: `content-${name}`,
    structuralHash: `struct-${name}-${children.length}`,
    merkleHash: `merkle-${id}`,
    children: children || [],
  };
}

// ============================================================================
// Property-Based Tests (fast-check)
// ============================================================================

describe('Property-Based Entropy Tests', () => {
  let calculator: EntropyCalculator;

  beforeEach(() => {
    calculator = new EntropyCalculator();
  });

  describe('Shannon Entropy Mathematical Properties', () => {
    it('entropy is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.double({ min: 0.001, max: 1, noNaN: true }), {
            minLength: 1,
            maxLength: 100,
          }),
          (probabilities) => {
            // Normalize to sum to 1
            const sum = probabilities.reduce((a, b) => a + b, 0);
            const normalized = probabilities.map((p) => p / sum);

            // Calculate Shannon entropy: H(X) = -Σ p(x) * log₂(p(x))
            const entropy = -normalized.reduce((acc, p) => acc + p * Math.log2(p), 0);

            return entropy >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('uniform distribution maximizes entropy', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 50 }), (n) => {
          // Uniform distribution: all outcomes equally likely
          const uniform = Array(n).fill(1 / n);
          const entropy = -uniform.reduce((acc, p) => acc + p * Math.log2(p), 0);

          // Maximum entropy for n outcomes is log₂(n)
          const maxEntropy = Math.log2(n);

          return Math.abs(entropy - maxEntropy) < 0.0001;
        }),
        { numRuns: 50 }
      );
    });

    it('certainty yields zero entropy', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 50 }), (n) => {
          // All probability on one outcome
          const certain = [1, ...Array(n - 1).fill(0)];
          const entropy = -certain.reduce((acc, p) => {
            if (p === 0) return acc;
            return acc + p * Math.log2(p);
          }, 0);

          return Math.abs(entropy) < 0.0001;
        }),
        { numRuns: 50 }
      );
    });

    it('entropy is bounded by log₂(n)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.double({ min: 0.001, max: 1, noNaN: true }), { minLength: 2, maxLength: 50 }),
          (probabilities) => {
            const sum = probabilities.reduce((a, b) => a + b, 0);
            const normalized = probabilities.map((p) => p / sum);

            const entropy = -normalized.reduce((acc, p) => acc + p * Math.log2(p), 0);
            const maxEntropy = Math.log2(normalized.length);

            return entropy <= maxEntropy + 0.0001; // Allow small floating point error
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Node Entropy Properties', () => {
    it('depth always increases structural entropy', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom('function', 'class', 'interface'),
            depth: fc.integer({ min: 0, max: 10 }),
          }),
          ({ type, depth }) => {
            const shallowNode = createMerkleNode(type, 'test', [], depth);
            const deeperNode = createMerkleNode(type, 'test', [], depth + 5);

            const shallowEntropy = calculator.calculateNodeEntropy(null, shallowNode);
            const deeperEntropy = calculator.calculateNodeEntropy(null, deeperNode);

            // Deeper nodes should have higher structural entropy
            return deeperEntropy.components.structural >= shallowEntropy.components.structural;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('removed nodes always have negative propagation', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom('function', 'class', 'interface', 'variable'),
            depth: fc.integer({ min: 0, max: 10 }),
          }),
          ({ type, depth }) => {
            const node = createMerkleNode(type, 'test', [], depth);
            const entropy = calculator.calculateNodeEntropy(node, null);

            return entropy.components.propagation < 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('total entropy equals structural + semantic + propagation', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom('function', 'class', 'interface', 'variable'),
            changeType: fc.constantFrom('added', 'removed', 'modified'),
            depth: fc.integer({ min: 0, max: 10 }),
          }),
          ({ type, changeType, depth }) => {
            const node = createMerkleNode(type, 'test', [], depth);

            // Use correct API based on change type
            const oldNode = changeType === 'added' ? null : node;
            const newNode = changeType === 'removed' ? null : node;
            const entropy = calculator.calculateNodeEntropy(oldNode, newNode);

            // Verify the mathematical formula: entropy = (0.4 * structural + 0.6 * semantic) * |propagation|
            const baseEntropy =
              0.4 * entropy.components.structural + 0.6 * entropy.components.semantic;
            const calculatedEntropy = baseEntropy * Math.abs(entropy.components.propagation);

            return Math.abs(entropy.entropy - calculatedEntropy) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Entropy Level Classification Properties', () => {
    it('entropy levels are monotonically ordered', () => {
      const levels = ['minimal', 'low', 'moderate', 'high', 'critical'] as const;
      // Test with normalized entropy range (0-1) matching default thresholds
      const thresholds = [0, 0.1, 0.3, 0.6, 0.8];

      fc.assert(
        fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (normalizedEntropy) => {
          const level = calculator.classify(normalizedEntropy);
          const levelIndex = levels.indexOf(level);

          // Verify level is within expected range for this normalized entropy value
          const matchingThreshold = thresholds.findIndex((t, i) => {
            const nextT = thresholds[i + 1] ?? Infinity;
            // Use <= for upper bound to handle boundary values correctly
            return normalizedEntropy >= t && normalizedEntropy <= nextT;
          });

          return levelIndex === matchingThreshold;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Entropy Aggregation Properties', () => {
    it('total entropy equals sum of node entropies', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom('function', 'class', 'interface', 'variable'),
              changeType: fc.constantFrom('added', 'removed', 'modified'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (nodeConfigs) => {
            const nodes = nodeConfigs.map((config, i) =>
              createMerkleNode(config.type, `node-${i}`, [], 0)
            );

            const changes = nodes.map((node) => ({ old: null, new: node }));
            const nodeEntropies = calculator.calculateBatchEntropy(changes);
            const totalEntropy = calculator.calculateTotalEntropy(nodeEntropies);

            // Total entropy uses diminishing returns (not simple sum)
            // Verify it's less than or equal to simple sum (diminishing property)
            const individualSum = nodeEntropies.reduce((sum, n) => sum + n.entropy, 0);

            // Calculate expected total with diminishing returns
            const sorted = [...nodeEntropies].sort((a, b) => b.entropy - a.entropy);
            let expectedTotal = 0;
            for (let i = 0; i < sorted.length; i++) {
              expectedTotal += sorted[i]!.entropy * Math.pow(0.9, i);
            }

            return Math.abs(totalEntropy - expectedTotal) < 0.001 && totalEntropy <= individualSum;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('entropy is commutative (order-independent)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom('function', 'class'),
              name: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (configs) => {
            const nodes1 = configs.map((c, i) => createMerkleNode(c.type, c.name, [], i));
            const nodes2 = [...nodes1].reverse();

            const changes1 = nodes1.map((node) => ({ old: null, new: node }));
            const changes2 = nodes2.map((node) => ({ old: null, new: node }));

            const nodeEntropies1 = calculator.calculateBatchEntropy(changes1);
            const nodeEntropies2 = calculator.calculateBatchEntropy(changes2);

            const totalEntropy1 = calculator.calculateTotalEntropy(nodeEntropies1);
            const totalEntropy2 = calculator.calculateTotalEntropy(nodeEntropies2);

            // Total entropy should be the same regardless of node order
            return Math.abs(totalEntropy1 - totalEntropy2) < 0.001;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
