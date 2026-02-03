/**
 * SED - Semantic Entropy Differencing
 * Entropy Calculator Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
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

      const result = calculator.calculateNodeEntropy(node, 'added');

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

      const result = calculator.calculateNodeEntropy(node, 'removed');

      expect(result.changeType).toBe('removed');
      expect(result.entropy).toBeGreaterThan(0);
    });

    it('should calculate entropy for a modified node', () => {
      const node: MerkleNode = createMerkleNode('function', 'modifiedFunc', []);

      const result = calculator.calculateNodeEntropy(node, 'modified');

      expect(result.changeType).toBe('modified');
      expect(result.entropy).toBeGreaterThan(0);
    });

    it('should weight semantic types correctly', () => {
      const functionNode = createMerkleNode('function', 'func', []);
      const variableNode = createMerkleNode('variable', 'var', []);

      const functionEntropy = calculator.calculateNodeEntropy(functionNode, 'modified');
      const variableEntropy = calculator.calculateNodeEntropy(variableNode, 'modified');

      // Functions should have higher semantic weight than variables
      expect(functionEntropy.semanticEntropy).toBeGreaterThan(variableEntropy.semanticEntropy);
    });

    it('should account for node depth in entropy', () => {
      const shallowNode = createMerkleNode('function', 'shallow', [], 1);
      const deepNode = createMerkleNode('function', 'deep', [], 5);

      const shallowEntropy = calculator.calculateNodeEntropy(shallowNode, 'modified');
      const deepEntropy = calculator.calculateNodeEntropy(deepNode, 'modified');

      // Depth affects structural entropy
      expect(shallowEntropy.structuralEntropy).not.toBe(deepEntropy.structuralEntropy);
    });

    it('should include propagation factor', () => {
      const parentNode = createMerkleNode('class', 'Parent', [
        createMerkleNode('function', 'method1', []),
        createMerkleNode('function', 'method2', []),
        createMerkleNode('function', 'method3', []),
      ]);

      const result = calculator.calculateNodeEntropy(parentNode, 'modified');

      // Nodes with children should have higher propagation factor
      expect(result.propagationFactor).toBeGreaterThan(1);
    });
  });

  describe('calculateBatchEntropy', () => {
    it('should calculate entropy for multiple nodes', () => {
      const nodes: MerkleNode[] = [
        createMerkleNode('function', 'func1', []),
        createMerkleNode('function', 'func2', []),
        createMerkleNode('class', 'Class1', []),
      ];

      const results = calculator.calculateBatchEntropy(nodes, 'modified');

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.entropy > 0)).toBe(true);
    });

    it('should handle empty input', () => {
      const results = calculator.calculateBatchEntropy([], 'added');

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
      const entropies = calculator.calculateBatchEntropy(nodes, 'modified');

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
      const uniformDist = [0.25, 0.25, 0.25, 0.25];
      const uniformEntropy = calculator.calculateDistributionEntropy(uniformDist);

      // Skewed distribution should have lower entropy
      const skewedDist = [0.9, 0.05, 0.03, 0.02];
      const skewedEntropy = calculator.calculateDistributionEntropy(skewedDist);

      expect(uniformEntropy).toBeGreaterThan(skewedEntropy);
    });

    it('should return 0 for single-value distribution', () => {
      const singleDist = [1.0];
      const entropy = calculator.calculateDistributionEntropy(singleDist);

      expect(entropy).toBe(0);
    });

    it('should handle zero probabilities', () => {
      const withZeros = [0.5, 0, 0.5, 0];
      const entropy = calculator.calculateDistributionEntropy(withZeros);

      expect(entropy).toBeGreaterThan(0);
      expect(Number.isFinite(entropy)).toBe(true);
    });
  });

  describe('calculateDivergence', () => {
    it('should calculate KL divergence', () => {
      const p = [0.5, 0.25, 0.25];
      const q = [0.33, 0.33, 0.34];

      const kl = calculator.calculateDivergence(p, q, 'kl');

      expect(kl).toBeGreaterThanOrEqual(0);
    });

    it('should calculate symmetric JS divergence', () => {
      const p = [0.5, 0.25, 0.25];
      const q = [0.33, 0.33, 0.34];

      const js = calculator.calculateDivergence(p, q, 'js');

      // JS divergence is symmetric
      const jsReverse = calculator.calculateDivergence(q, p, 'js');
      expect(Math.abs(js - jsReverse)).toBeLessThan(0.001);
    });

    it('should return 0 for identical distributions', () => {
      const p = [0.5, 0.3, 0.2];

      const kl = calculator.calculateDivergence(p, p, 'kl');
      const js = calculator.calculateDivergence(p, p, 'js');

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
      const result = calculator.calculateNodeEntropy(node, 'added');

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

      const result = calculator.calculateNodeEntropy(complexNode, 'modified');

      expect(['moderate', 'high', 'critical']).toContain(result.level);
    });
  });
});

// Helper functions

function createMerkleNode(
  type: string,
  name: string,
  children: MerkleNode[],
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
    children,
  };
}
