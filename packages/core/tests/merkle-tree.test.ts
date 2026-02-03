/**
 * SED - Semantic Entropy Differencing
 * Merkle Tree Builder Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MerkleTreeBuilder } from '../src/semantic/merkle-tree.js';
import type { SemanticNode, MerkleNode } from '@sed/shared/types';

describe('MerkleTreeBuilder', () => {
  let builder: MerkleTreeBuilder;

  beforeEach(() => {
    builder = new MerkleTreeBuilder();
  });

  describe('buildTree', () => {
    it('should build a Merkle tree from semantic nodes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'myFunc', 'function myFunc() {}', []),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees).toHaveLength(1);
      expect(trees[0].type).toBe('function');
      expect(trees[0].name).toBe('myFunc');
    });

    it('should compute content hash', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees[0].contentHash).toBeDefined();
      expect(typeof trees[0].contentHash).toBe('string');
      expect(trees[0].contentHash.length).toBeGreaterThan(0);
    });

    it('should compute structural hash', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'MyClass', '', [
          createSemanticNode('function', 'method', 'method() {}', []),
        ]),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees[0].structuralHash).toBeDefined();
      expect(typeof trees[0].structuralHash).toBe('string');
    });

    it('should compute Merkle hash from content and children', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() {}', []),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees[0].merkleHash).toBeDefined();
      expect(trees[0].merkleHash.length).toBeGreaterThan(0);
    });

    it('should preserve hierarchy in Merkle tree', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', 'method1() {}', []),
          createSemanticNode('function', 'method2', 'method2() {}', []),
        ]),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees[0].children).toHaveLength(2);
      expect(trees[0].children[0].type).toBe('function');
      expect(trees[0].children[1].type).toBe('function');
    });

    it('should track depth correctly', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', '', [
            createSemanticNode('function', 'method', '', []),
          ]),
        ]),
      ];

      const trees = builder.buildTree(nodes);

      expect(trees[0].depth).toBe(0);
      expect(trees[0].children[0].depth).toBe(1);
      expect(trees[0].children[0].children[0].depth).toBe(2);
    });

    it('should handle empty input', () => {
      const trees = builder.buildTree([]);

      expect(trees).toHaveLength(0);
    });
  });

  describe('hash consistency', () => {
    it('should produce same hash for identical content', () => {
      const node1: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];
      const node2: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];

      const tree1 = builder.buildTree(node1);
      const tree2 = builder.buildTree(node2);

      expect(tree1[0].contentHash).toBe(tree2[0].contentHash);
      expect(tree1[0].merkleHash).toBe(tree2[0].merkleHash);
    });

    it('should produce different hash for different content', () => {
      const node1: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];
      const node2: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 2; }', []),
      ];

      const tree1 = builder.buildTree(node1);
      const tree2 = builder.buildTree(node2);

      expect(tree1[0].contentHash).not.toBe(tree2[0].contentHash);
      expect(tree1[0].merkleHash).not.toBe(tree2[0].merkleHash);
    });

    it('should reflect child changes in parent hash', () => {
      const parent1: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'child', 'original', []),
        ]),
      ];
      const parent2: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'child', 'modified', []),
        ]),
      ];

      const tree1 = builder.buildTree(parent1);
      const tree2 = builder.buildTree(parent2);

      // Child hash differs
      expect(tree1[0].children[0].merkleHash).not.toBe(tree2[0].children[0].merkleHash);
      // Parent hash also differs due to Merkle property
      expect(tree1[0].merkleHash).not.toBe(tree2[0].merkleHash);
    });

    it('should reflect structural changes in hash', () => {
      const structure1: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', '', []),
        ]),
      ];
      const structure2: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', '', []),
          createSemanticNode('function', 'method2', '', []),
        ]),
      ];

      const tree1 = builder.buildTree(structure1);
      const tree2 = builder.buildTree(structure2);

      expect(tree1[0].structuralHash).not.toBe(tree2[0].structuralHash);
      expect(tree1[0].merkleHash).not.toBe(tree2[0].merkleHash);
    });
  });

  describe('getHash', () => {
    it('should return hash for content string', () => {
      const hash1 = builder.getHash('test content');
      const hash2 = builder.getHash('test content');
      const hash3 = builder.getHash('different content');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('compareNodes', () => {
    it('should detect identical nodes', () => {
      const node: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const tree = builder.buildTree(node);
      const result = builder.compareNodes(tree[0], tree[0]);

      expect(result.isEqual).toBe(true);
      expect(result.contentChanged).toBe(false);
      expect(result.structureChanged).toBe(false);
    });

    it('should detect content changes', () => {
      const node1 = builder.buildTree([createSemanticNode('function', 'func', 'original', [])])[0];
      const node2 = builder.buildTree([createSemanticNode('function', 'func', 'modified', [])])[0];

      const result = builder.compareNodes(node1, node2);

      expect(result.isEqual).toBe(false);
      expect(result.contentChanged).toBe(true);
    });

    it('should detect structural changes', () => {
      const node1 = builder.buildTree([
        createSemanticNode('class', 'cls', '', [createSemanticNode('function', 'm1', '', [])]),
      ])[0];
      const node2 = builder.buildTree([
        createSemanticNode('class', 'cls', '', [
          createSemanticNode('function', 'm1', '', []),
          createSemanticNode('function', 'm2', '', []),
        ]),
      ])[0];

      const result = builder.compareNodes(node1, node2);

      expect(result.isEqual).toBe(false);
      expect(result.structureChanged).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use custom hash algorithm', () => {
      const sha512Builder = new MerkleTreeBuilder({
        hashAlgorithm: 'sha512',
      });

      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const tree = sha512Builder.buildTree(nodes);

      // SHA-512 produces longer hashes
      expect(tree[0].contentHash.length).toBeGreaterThan(64);
    });

    it('should normalize content when configured', () => {
      const normalizingBuilder = new MerkleTreeBuilder({
        normalizeWhitespace: true,
      });

      const node1: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];
      const node2: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func()  {  return 1;  }', []),
      ];

      const tree1 = normalizingBuilder.buildTree(node1);
      const tree2 = normalizingBuilder.buildTree(node2);

      // Normalized content should have same hash
      expect(tree1[0].contentHash).toBe(tree2[0].contentHash);
    });
  });
});

// Helper function
function createSemanticNode(
  type: string,
  name: string,
  content: string,
  children: SemanticNode[]
): SemanticNode {
  return {
    id: `node-${name}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    name,
    content,
    range: { start: 0, end: content.length },
    children,
  };
}
