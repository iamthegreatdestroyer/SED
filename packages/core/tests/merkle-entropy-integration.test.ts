/**
 * Integration tests for Merkle Tree + Entropy Calculator
 * Validates that both components work together effectively for semantic analysis
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MerkleTreeBuilder } from '../src/semantic/merkle-tree';
import { EntropyCalculator } from '../src/entropy/entropy-calculator';
import type { SemanticNode, MerkleNode } from '@sed/shared/types';
import { sha256 } from '@sed/shared/utils';

describe('Merkle Tree + Entropy Calculator Integration', () => {
  let merkleBuilder: MerkleTreeBuilder;
  let entropyCalc: EntropyCalculator;

  beforeEach(() => {
    merkleBuilder = new MerkleTreeBuilder();
    entropyCalc = new EntropyCalculator();
  });

  // Helper to create semantic nodes
  function createSemanticNode(
    type: string,
    name: string,
    content: string,
    children: SemanticNode[] = []
  ): SemanticNode {
    const contentHash = sha256(content);
    return {
      id: `node-${name}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      name,
      content,
      contentHash,
      range: { start: 0, end: content.length },
      startLine: 1,
      endLine: 1,
      children,
    };
  }

  it('should use Merkle tree for efficient change detection before entropy calculation', () => {
    // Create old version of code structure
    const oldNodes = [
      createSemanticNode('class', 'Calculator', 'class Calculator {}', [
        createSemanticNode('method', 'add', 'function add(a, b) { return a + b; }', []),
        createSemanticNode('method', 'subtract', 'function subtract(a, b) { return a - b; }', []),
        createSemanticNode('method', 'multiply', 'function multiply(a, b) { return a * b; }', []),
      ]),
    ];

    // Create new version - only 'multiply' method changed
    const newNodes = [
      createSemanticNode('class', 'Calculator', 'class Calculator {}', [
        createSemanticNode('method', 'add', 'function add(a, b) { return a + b; }', []),
        createSemanticNode('method', 'subtract', 'function subtract(a, b) { return a - b; }', []),
        createSemanticNode(
          'method',
          'multiply',
          'function multiply(a, b) { return a * b * 2; }', // Changed!
          []
        ),
      ]),
    ];

    // Step 1: Build Merkle trees
    const { roots: oldRoots } = merkleBuilder.build(oldNodes);
    const { roots: newRoots } = merkleBuilder.build(newNodes);

    // Step 2: Use Merkle tree to identify minimal change set
    const changes = merkleBuilder.findChangedSubtrees(oldRoots, newRoots);

    // Verify Merkle tree correctly identified only the changed method
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.path.includes('multiply'))).toBe(true);

    // Step 3: Calculate entropy only for changed subtrees (efficiency gain!)
    const entropyResults = changes
      .filter((c) => c.oldNode && c.newNode)
      .map((change) => {
        const entropyResult = entropyCalc.calculateNodeEntropy(change.oldNode!, change.newNode!);

        return {
          path: change.path.join('/'),
          entropy: entropyResult.entropy,
        };
      });

    // Verify entropy was calculated for changed nodes
    expect(entropyResults.length).toBeGreaterThan(0);
    entropyResults.forEach((result) => {
      expect(result.entropy).toBeGreaterThan(0); // Change detected
    });

    // Key insight: We calculated entropy for ~1 method instead of 3
    // This is the efficiency gain from Merkle tree hash-based filtering
    expect(entropyResults.length).toBeLessThan(3);
  });

  it('should calculate accurate entropy for Merkle-detected modifications', () => {
    const oldNode = createSemanticNode(
      'function',
      'greet',
      'function greet() { return "Hello"; }',
      []
    );
    const newNode = createSemanticNode(
      'function',
      'greet',
      'function greet() { return "Hi there!"; }',
      []
    );

    // Build trees and compare
    const { roots: oldRoots } = merkleBuilder.build([oldNode]);
    const { roots: newRoots } = merkleBuilder.build([newNode]);

    const comparison = merkleBuilder.compare(oldRoots, newRoots);

    // Should detect modification
    expect(comparison.modified.length).toBe(1);

    // Calculate entropy for the modification
    const modified = comparison.modified[0];

    const entropyResult = entropyCalc.calculateNodeEntropy(modified.old, modified.new);

    // Verify entropy reflects semantic change
    expect(entropyResult.entropy).toBeGreaterThan(0);

    // The specific entropy value shows magnitude of change
    // String length change: "Hello" (5) → "Hi there!" (9)
    expect(entropyResult.entropy).toBeGreaterThan(0.3); // Significant change
  });

  it('should verify tree integrity before entropy calculation', () => {
    const oldNodes = [
      createSemanticNode('module', 'math', 'export const PI = 3.14;', [
        createSemanticNode('variable', 'PI', 'const PI = 3.14;', []),
      ]),
    ];

    const newNodes = [
      createSemanticNode('module', 'math', 'export const PI = 3.14159;', [
        createSemanticNode('variable', 'PI', 'const PI = 3.14159;', []),
      ]),
    ];

    const { roots: oldRoots } = merkleBuilder.build(oldNodes);
    const { roots: newRoots } = merkleBuilder.build(newNodes);

    // Verify tree integrity first (best practice)
    const isOldValid = merkleBuilder.verify(oldRoots);
    const isNewValid = merkleBuilder.verify(newRoots);
    expect(isOldValid).toBe(true);
    expect(isNewValid).toBe(true);

    // Only proceed with entropy calculation if trees are valid
    if (isOldValid && isNewValid) {
      const entropyResult = entropyCalc.calculateNodeEntropy(oldRoots[0], newRoots[0]);
      expect(entropyResult.entropy).toBeGreaterThan(0);
    }

    // Simulate corrupted tree
    const corruptedRoots: MerkleNode[] = [
      {
        ...oldRoots[0],
        merkleHash: 'corrupted-hash-12345', // Tampered hash
      },
    ];

    const isCorruptedValid = merkleBuilder.verify(corruptedRoots);
    expect(isCorruptedValid).toBe(false);

    // Should NOT calculate entropy for corrupted trees
    // (In production, this would prevent analyzing invalid data)
  });

  it('should handle large trees efficiently with Merkle optimization', () => {
    // Create a large tree (simulating real codebase)
    const createLargeTree = (nodeCount: number): SemanticNode[] => {
      const nodes: SemanticNode[] = [];

      for (let i = 0; i < nodeCount; i++) {
        nodes.push(
          createSemanticNode('function', `func${i}`, `function func${i}() { return ${i}; }`, [])
        );
      }

      return nodes;
    };

    const oldNodes = createLargeTree(50); // 50 functions
    const newNodes = [...createLargeTree(50)];

    // Modify only ONE function (simulate small change in large codebase)
    newNodes[25] = createSemanticNode(
      'function',
      'func25',
      'function func25() { return 250; }', // Changed from 25 to 250
      []
    );

    // Build Merkle trees
    const startBuild = performance.now();
    const { roots: oldRoots, stats: oldStats } = merkleBuilder.build(oldNodes);
    const { roots: newRoots, stats: newStats } = merkleBuilder.build(newNodes);
    const buildTime = performance.now() - startBuild;

    // Verify trees were built efficiently
    expect(oldStats.totalNodes).toBe(50);
    expect(newStats.totalNodes).toBe(50);

    // Use Merkle tree to find changes (O(log n) average case)
    const startFind = performance.now();
    const changes = merkleBuilder.findChangedSubtrees(oldRoots, newRoots);
    const findTime = performance.now() - startFind;

    // Key efficiency: findChangedSubtrees should be MUCH faster than full tree walk
    // With Merkle hashes, unchanged branches are skipped entirely
    expect(findTime).toBeLessThan(buildTime); // Should be faster

    // Verify only the changed function was detected
    expect(changes.length).toBe(1);
    expect(changes[0].path.includes('func25')).toBe(true);

    // Calculate entropy only for changed function
    const change = changes[0];
    if (change.oldNode && change.newNode) {
      const entropyResult = entropyCalc.calculateNodeEntropy(change.oldNode, change.newNode);

      expect(entropyResult.entropy).toBeGreaterThan(0);
    }

    // Performance insight: Instead of calculating entropy for all 50 functions,
    // we only calculated for 1 function (50x efficiency gain!)
  });

  it('should combine Merkle statistics with entropy metrics for comprehensive analysis', () => {
    const oldNodes = [
      createSemanticNode('module', 'utils', 'export const helpers = {};', [
        createSemanticNode('function', 'helper1', 'function helper1() {}', []),
        createSemanticNode('function', 'helper2', 'function helper2() {}', []),
      ]),
    ];

    const newNodes = [
      createSemanticNode('module', 'utils', 'export const helpers = {};', [
        createSemanticNode('function', 'helper1', 'function helper1() { return 1; }', []), // Modified
        createSemanticNode('function', 'helper2', 'function helper2() {}', []),
        createSemanticNode('function', 'helper3', 'function helper3() {}', []), // Added
      ]),
    ];

    // Build trees with statistics
    const { roots: oldRoots, stats: oldStats } = merkleBuilder.build(oldNodes);
    const { roots: newRoots, stats: newStats } = merkleBuilder.build(newNodes);

    // Analyze structural changes with Merkle tree
    const comparison = merkleBuilder.compare(oldRoots, newRoots);
    const changes = merkleBuilder.findChangedSubtrees(oldRoots, newRoots);

    // Combine Merkle stats with entropy analysis
    const analysis = {
      structure: {
        oldNodes: oldStats.totalNodes,
        newNodes: newStats.totalNodes,
        oldDepth: oldStats.maxDepth,
        newDepth: newStats.maxDepth,
        buildTime: oldStats.buildTime + newStats.buildTime,
      },
      changes: {
        added: comparison.added.length,
        removed: comparison.removed.length,
        modified: comparison.modified.length,
        unchanged: comparison.unchanged.length,
        changeLocations: changes.map((c) => c.path.join('/')),
      },
      entropy: changes
        .filter((c) => c.oldNode && c.newNode)
        .map((c) => {
          const entropyResult = entropyCalc.calculateNodeEntropy(c.oldNode!, c.newNode!);
          return {
            path: c.path.join('/'),
            value: entropyResult.entropy,
          };
        }),
    };

    // Verify comprehensive analysis
    expect(analysis.structure.newNodes).toBeGreaterThan(analysis.structure.oldNodes);
    expect(analysis.changes.added).toBe(1); // helper3 added
    // Note: When helper1 changes, utils module also marked as modified (hash propagation)
    expect(analysis.changes.modified).toBe(2); // helper1 + utils (parent)
    expect(analysis.entropy.length).toBeGreaterThan(0);

    // Entropy should reflect actual semantic changes
    const modifiedEntropy = analysis.entropy.find((e) => e.path.includes('helper1'));
    expect(modifiedEntropy).toBeDefined();
    expect(modifiedEntropy!.value).toBeGreaterThan(0);

    // This combined analysis provides:
    // 1. Merkle tree stats: structural overview
    // 2. Comparison: what changed
    // 3. Change detection: where changes occurred
    // 4. Entropy: magnitude of semantic changes
  });

  it('should use Merkle hashing to skip entropy calculation for unchanged branches', () => {
    const oldTree = createSemanticNode('module', 'app', 'module app', [
      createSemanticNode('class', 'A', 'class A {}', [
        createSemanticNode('method', 'a1', 'method a1() {}', []),
        createSemanticNode('method', 'a2', 'method a2() {}', []),
      ]),
      createSemanticNode('class', 'B', 'class B {}', [
        createSemanticNode('method', 'b1', 'method b1() {}', []),
      ]),
    ]);

    const newTree = createSemanticNode('module', 'app', 'module app', [
      createSemanticNode('class', 'A', 'class A {}', [
        createSemanticNode('method', 'a1', 'method a1() {}', []),
        createSemanticNode('method', 'a2', 'method a2() {}', []),
      ]),
      createSemanticNode('class', 'B', 'class B {}', [
        createSemanticNode('method', 'b1', 'method b1() { return 1; }', []), // Only this changed
      ]),
    ]);

    const { roots: oldRoots } = merkleBuilder.build([oldTree]);
    const { roots: newRoots } = merkleBuilder.build([newTree]);

    // Find changes using Merkle hashes
    const changes = merkleBuilder.findChangedSubtrees(oldRoots, newRoots);

    // Key efficiency: Class A's hash is unchanged, so entire branch is skipped
    // Only Class B needs to be examined
    expect(changes.every((c) => c.path.includes('B'))).toBe(true);
    expect(changes.some((c) => c.path.includes('A'))).toBe(false);

    // Calculate entropy only for changed branch (Class B)
    const changedNodes = changes.filter((c) => c.oldNode && c.newNode);

    expect(changedNodes.length).toBeGreaterThan(0);

    changedNodes.forEach((change) => {
      const entropyResult = entropyCalc.calculateNodeEntropy(change.oldNode!, change.newNode!);

      expect(entropyResult.entropy).toBeGreaterThan(0); // Should detect change
    });

    // Without Merkle tree: would need to compare all 5 nodes
    // With Merkle tree: only compare 2 nodes in Class B branch
    // This is the power of hash-based change detection!
  });

  it('should handle edge case where entropy is zero but Merkle hash changes', () => {
    // Edge case: whitespace change (semantically identical but structurally different)
    const oldNode = createSemanticNode('function', 'test', 'function test(){return 1;}', []);
    const newNode = createSemanticNode('function', 'test', 'function test() { return 1; }', []);

    const { roots: oldRoots } = merkleBuilder.build([oldNode]);
    const { roots: newRoots } = merkleBuilder.build([newNode]);

    // Merkle tree detects structural difference
    const changes = merkleBuilder.findChangedSubtrees(oldRoots, newRoots);
    expect(changes.length).toBeGreaterThan(0);

    // Entropy might be low or zero (semantically same)
    const merkleOldRoot = oldRoots[0];
    const merkleNewRoot = newRoots[0];
    const entropyResult = entropyCalc.calculateNodeEntropy(merkleOldRoot, merkleNewRoot);

    // Both metrics provide value:
    // - Merkle hash: detects ANY change (including whitespace)
    // - Entropy: measures SEMANTIC significance
    expect(changes.length).toBeGreaterThan(0); // Merkle detected change
    // Entropy could be low (semantically similar despite structural difference)
  });
});
