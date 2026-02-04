/**
 * SED - Semantic Entropy Differencing
 * Merkle Tree Builder Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MerkleTreeBuilder } from '../src/semantic/merkle-tree.js';
import type { SemanticNode, MerkleNode } from '@sed/shared/types';
import { sha256 } from '@sed/shared/utils';
import * as fc from 'fast-check';

describe('MerkleTreeBuilder', () => {
  let builder: MerkleTreeBuilder;

  beforeEach(() => {
    builder = new MerkleTreeBuilder();
  });

  describe('build', () => {
    it('should build a Merkle tree from semantic nodes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'myFunc', 'function myFunc() {}', []),
      ];

      const { roots, stats } = builder.build(nodes);

      expect(roots).toHaveLength(1);
      expect(roots[0].type).toBe('function');
      expect(roots[0].name).toBe('myFunc');
      expect(stats.totalNodes).toBeGreaterThan(0);
    });

    it('should compute content hash', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() { return 1; }', []),
      ];

      const { roots } = builder.build(nodes);

      expect(roots[0].contentHash).toBeDefined();
      expect(typeof roots[0].contentHash).toBe('string');
      expect(roots[0].contentHash.length).toBeGreaterThan(0);
    });

    it('should compute structural hash', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'MyClass', '', [
          createSemanticNode('function', 'method', 'method() {}', []),
        ]),
      ];

      const { roots } = builder.build(nodes);

      expect(roots[0].structuralHash).toBeDefined();
      expect(typeof roots[0].structuralHash).toBe('string');
    });

    it('should compute Merkle hash from content and children', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'func', 'function func() {}', []),
      ];

      const { roots } = builder.build(nodes);

      expect(roots[0].merkleHash).toBeDefined();
      expect(roots[0].merkleHash.length).toBeGreaterThan(0);
    });

    it('should preserve hierarchy in Merkle tree', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', 'method1() {}', []),
          createSemanticNode('function', 'method2', 'method2() {}', []),
        ]),
      ];

      const { roots } = builder.build(nodes);

      expect(roots[0].children).toHaveLength(2);
      expect(roots[0].children[0].type).toBe('function');
      expect(roots[0].children[1].type).toBe('function');
    });

    it('should track depth correctly', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', '', [
            createSemanticNode('function', 'method', '', []),
          ]),
        ]),
      ];

      const { roots } = builder.build(nodes);

      expect(roots[0].depth).toBe(0);
      expect(roots[0].children[0].depth).toBe(1);
      expect(roots[0].children[0].children[0].depth).toBe(2);
    });

    it('should handle empty input', () => {
      const { roots } = builder.build([]);

      expect(roots).toHaveLength(0);
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

      const { roots: tree1 } = builder.build(node1);
      const { roots: tree2 } = builder.build(node2);

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

      const { roots: tree1 } = builder.build(node1);
      const { roots: tree2 } = builder.build(node2);

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

      const { roots: tree1 } = builder.build(parent1);
      const { roots: tree2 } = builder.build(parent2);

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

      const { roots: tree1 } = builder.build(structure1);
      const { roots: tree2 } = builder.build(structure2);

      expect(tree1[0].structuralHash).not.toBe(tree2[0].structuralHash);
      expect(tree1[0].merkleHash).not.toBe(tree2[0].merkleHash);
    });
  });

  describe('compare', () => {
    it('should detect added nodes', () => {
      const old: SemanticNode[] = [createSemanticNode('function', 'func1', 'content1', [])];
      const newNodes: SemanticNode[] = [
        createSemanticNode('function', 'func1', 'content1', []),
        createSemanticNode('function', 'func2', 'content2', []),
      ];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const result = builder.compare(oldRoots, newRoots);

      expect(result.added).toHaveLength(1);
      expect(result.added[0].name).toBe('func2');
      expect(result.removed).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
      expect(result.unchanged).toHaveLength(1);
    });

    it('should detect removed nodes', () => {
      const old: SemanticNode[] = [
        createSemanticNode('function', 'func1', 'content1', []),
        createSemanticNode('function', 'func2', 'content2', []),
      ];
      const newNodes: SemanticNode[] = [createSemanticNode('function', 'func1', 'content1', [])];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const result = builder.compare(oldRoots, newRoots);

      expect(result.removed).toHaveLength(1);
      expect(result.removed[0].name).toBe('func2');
      expect(result.added).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
      expect(result.unchanged).toHaveLength(1);
    });

    it('should detect modified nodes', () => {
      const old: SemanticNode[] = [createSemanticNode('function', 'func', 'original', [])];
      const newNodes: SemanticNode[] = [createSemanticNode('function', 'func', 'modified', [])];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const result = builder.compare(oldRoots, newRoots);

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].old.name).toBe('func');
      expect(result.modified[0].new.name).toBe('func');
      expect(result.modified[0].old.contentHash).not.toBe(result.modified[0].new.contentHash);
      expect(result.added).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
      expect(result.unchanged).toHaveLength(0);
    });

    it('should detect unchanged nodes', () => {
      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { roots: oldRoots } = builder.build(nodes);
      const { roots: newRoots } = builder.build(nodes);
      const result = builder.compare(oldRoots, newRoots);

      expect(result.unchanged).toHaveLength(1);
      expect(result.added).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
    });

    it('should detect structural changes in hierarchy', () => {
      const old: SemanticNode[] = [
        createSemanticNode('class', 'cls', '', [
          createSemanticNode('function', 'm1', 'method1', []),
        ]),
      ];
      const newNodes: SemanticNode[] = [
        createSemanticNode('class', 'cls', '', [
          createSemanticNode('function', 'm1', 'method1', []),
          createSemanticNode('function', 'm2', 'method2', []),
        ]),
      ];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const result = builder.compare(oldRoots, newRoots);

      // Parent node should be modified due to child changes
      expect(result.modified.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('statistics', () => {
    it('should track total nodes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', '', []),
          createSemanticNode('function', 'method2', '', []),
        ]),
      ];

      const { stats } = builder.build(nodes);

      expect(stats.totalNodes).toBe(3); // 1 class + 2 methods
    });

    it('should track max depth', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', '', [
            createSemanticNode('function', 'method', '', []),
          ]),
        ]),
      ];

      const { stats } = builder.build(nodes);

      expect(stats.maxDepth).toBe(2); // method is at depth 2
    });

    it('should track leaf nodes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method1', '', []),
          createSemanticNode('function', 'method2', '', []),
        ]),
      ];

      const { stats } = builder.build(nodes);

      expect(stats.leafNodes).toBe(2); // 2 methods with no children
    });

    it('should track build time', () => {
      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { stats } = builder.build(nodes);

      expect(stats.buildTime).toBeGreaterThanOrEqual(0);
      expect(typeof stats.buildTime).toBe('number');
    });
  });

  describe('options', () => {
    it('should respect includeStructure option', () => {
      const builderNoStructure = new MerkleTreeBuilder({ includeStructure: false });
      const builderWithStructure = new MerkleTreeBuilder({ includeStructure: true });

      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { roots: roots1 } = builderNoStructure.build(nodes);
      const { roots: roots2 } = builderWithStructure.build(nodes);

      // Hashes should differ when structure is/isn't included
      expect(roots1[0].merkleHash).not.toBe(roots2[0].merkleHash);
    });

    it('should respect includeContent option', () => {
      const builderNoContent = new MerkleTreeBuilder({ includeContent: false });
      const builderWithContent = new MerkleTreeBuilder({ includeContent: true });

      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { roots: roots1 } = builderNoContent.build(nodes);
      const { roots: roots2 } = builderWithContent.build(nodes);

      // Hashes should differ when content is/isn't included
      expect(roots1[0].merkleHash).not.toBe(roots2[0].merkleHash);
    });

    it('should enforce maxDepth limit', () => {
      const shallowBuilder = new MerkleTreeBuilder({ maxDepth: 1 });

      const nodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', '', [
            createSemanticNode('function', 'method', '', []),
          ]),
        ]),
      ];

      expect(() => shallowBuilder.build(nodes)).toThrow('Maximum tree depth');
    });
  });

  describe('findChangedSubtrees', () => {
    it('should identify minimal changed subtrees', () => {
      const old: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', 'original', []),
          createSemanticNode('class', 'Class2', 'unchanged', []),
        ]),
      ];
      const newNodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'Class1', 'modified', []),
          createSemanticNode('class', 'Class2', 'unchanged', []),
        ]),
      ];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const changed = builder.findChangedSubtrees(oldRoots, newRoots);

      // Should identify only the changed Class1, not Class2
      expect(changed.length).toBeGreaterThan(0);
      expect(changed[0].changeType).toBe('modified');
      expect(changed[0].path.join('/')).toContain('Class1');
    });

    it('should detect added subtrees', () => {
      const old: SemanticNode[] = [createSemanticNode('class', 'Class1', '', [])];
      const newNodes: SemanticNode[] = [
        createSemanticNode('class', 'Class1', '', []),
        createSemanticNode('class', 'Class2', '', []),
      ];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const changed = builder.findChangedSubtrees(oldRoots, newRoots);

      const added = changed.filter((c) => c.changeType === 'added');
      expect(added.length).toBe(1);
      expect(added[0].path.join('/')).toContain('Class2');
    });

    it('should detect removed subtrees', () => {
      const old: SemanticNode[] = [
        createSemanticNode('class', 'Class1', '', []),
        createSemanticNode('class', 'Class2', '', []),
      ];
      const newNodes: SemanticNode[] = [createSemanticNode('class', 'Class1', '', [])];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const changed = builder.findChangedSubtrees(oldRoots, newRoots);

      const removed = changed.filter((c) => c.changeType === 'removed');
      expect(removed.length).toBe(1);
      expect(removed[0].path.join('/')).toContain('Class2');
    });

    it('should return empty array for identical trees', () => {
      const nodes: SemanticNode[] = [createSemanticNode('class', 'Class1', 'same', [])];

      const { roots: oldRoots } = builder.build(nodes);
      const { roots: newRoots } = builder.build(nodes);
      const changed = builder.findChangedSubtrees(oldRoots, newRoots);

      expect(changed).toHaveLength(0);
    });

    it('should skip unchanged branches using hash comparison', () => {
      const old: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'UnchangedClass', 'same', [
            createSemanticNode('function', 'method1', 'same', []),
            createSemanticNode('function', 'method2', 'same', []),
          ]),
          createSemanticNode('class', 'ChangedClass', 'original', []),
        ]),
      ];
      const newNodes: SemanticNode[] = [
        createSemanticNode('module', 'root', '', [
          createSemanticNode('class', 'UnchangedClass', 'same', [
            createSemanticNode('function', 'method1', 'same', []),
            createSemanticNode('function', 'method2', 'same', []),
          ]),
          createSemanticNode('class', 'ChangedClass', 'modified', []),
        ]),
      ];

      const { roots: oldRoots } = builder.build(old);
      const { roots: newRoots } = builder.build(newNodes);
      const changed = builder.findChangedSubtrees(oldRoots, newRoots);

      // Should only report ChangedClass, not UnchangedClass or its children
      expect(changed.every((c) => !c.path.join('/').includes('UnchangedClass'))).toBe(true);
      expect(changed.some((c) => c.path.join('/').includes('ChangedClass'))).toBe(true);
    });
  });

  describe('verify', () => {
    it('should verify valid tree integrity', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method', '', []),
        ]),
      ];

      const { roots } = builder.build(nodes);
      const isValid = builder.verify(roots);

      expect(isValid).toBe(true);
    });

    it('should detect corrupted child hashes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', '', [
          createSemanticNode('function', 'method', '', []),
        ]),
      ];

      const { roots } = builder.build(nodes);

      // Corrupt a child hash
      const corruptedRoots = [
        {
          ...roots[0],
          children: [
            {
              ...roots[0].children[0],
              merkleHash: 'corrupted-hash',
            },
          ],
        },
      ];

      const isValid = builder.verify(corruptedRoots);

      expect(isValid).toBe(false);
    });

    it('should verify empty tree', () => {
      const isValid = builder.verify([]);
      expect(isValid).toBe(true);
    });

    it('should detect tampered content hash', () => {
      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { roots } = builder.build(nodes);

      // Corrupt content hash
      const tampered = [
        {
          ...roots[0],
          contentHash: 'tampered-hash',
        },
      ];

      const isValid = builder.verify(tampered);

      expect(isValid).toBe(false);
    });
  });

  describe('computeRootHash', () => {
    it('should compute combined hash for multiple roots', () => {
      const nodes1: SemanticNode[] = [createSemanticNode('class', 'Class1', 'content1', [])];
      const nodes2: SemanticNode[] = [createSemanticNode('class', 'Class2', 'content2', [])];

      const { roots: roots1 } = builder.build(nodes1);
      const { roots: roots2 } = builder.build(nodes2);
      const combined = [...roots1, ...roots2];

      const combinedHash = builder.computeRootHash(combined);

      expect(combinedHash).toBeDefined();
      expect(typeof combinedHash).toBe('string');
      expect(combinedHash.length).toBeGreaterThan(0);
    });

    it('should produce different hash for different root sets', () => {
      const nodes1: SemanticNode[] = [createSemanticNode('class', 'Class1', 'content', [])];
      const nodes2: SemanticNode[] = [createSemanticNode('class', 'Class2', 'content', [])];

      const { roots: roots1 } = builder.build(nodes1);
      const { roots: roots2 } = builder.build(nodes2);

      const hash1 = builder.computeRootHash(roots1);
      const hash2 = builder.computeRootHash(roots2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle single root', () => {
      const nodes: SemanticNode[] = [createSemanticNode('function', 'func', 'content', [])];

      const { roots } = builder.build(nodes);
      const rootHash = builder.computeRootHash(roots);

      // For single root, should be deterministic
      expect(rootHash).toBe(roots[0].merkleHash);
    });

    it('should handle empty roots', () => {
      const rootHash = builder.computeRootHash([]);

      expect(rootHash).toBeDefined();
      expect(typeof rootHash).toBe('string');
      expect(rootHash.length).toBeGreaterThan(0);
    });

    it('should be order-dependent', () => {
      const nodes1: SemanticNode[] = [createSemanticNode('class', 'A', '', [])];
      const nodes2: SemanticNode[] = [createSemanticNode('class', 'B', '', [])];

      const { roots: roots1 } = builder.build(nodes1);
      const { roots: roots2 } = builder.build(nodes2);

      const hashAB = builder.computeRootHash([...roots1, ...roots2]);
      const hashBA = builder.computeRootHash([...roots2, ...roots1]);

      expect(hashAB).not.toBe(hashBA);
    });
  });

  describe('edge cases', () => {
    it('should handle node with no children and no structure', () => {
      const noStructureBuilder = new MerkleTreeBuilder({ includeStructure: false });
      const nodes: SemanticNode[] = [createSemanticNode('function', 'leaf', 'content', [])];

      const { roots } = noStructureBuilder.build(nodes);

      // Should still build valid tree
      expect(roots).toHaveLength(1);
      expect(roots[0].contentHash).toBeDefined();
      expect(roots[0].merkleHash).toBeDefined();
    });

    it('should handle node with children but no content', () => {
      const noContentBuilder = new MerkleTreeBuilder({ includeContent: false });
      const nodes: SemanticNode[] = [
        createSemanticNode('class', 'Parent', 'ignored-content', [
          createSemanticNode('function', 'child', 'also-ignored', []),
        ]),
      ];

      const { roots } = noContentBuilder.build(nodes);

      // Should build tree based only on structure
      expect(roots).toHaveLength(1);
      expect(roots[0].structuralHash).toBeDefined();
      expect(roots[0].merkleHash).toBeDefined();
    });
  });

  describe('Property-Based Tests', () => {
    // Arbitrary generators for property-based testing
    const arbNodeType = fc.constantFrom('function', 'class', 'method', 'module', 'variable');
    const arbNodeName = fc.string({ minLength: 1, maxLength: 20 });
    const arbContent = fc.string({ minLength: 0, maxLength: 100 });

    const arbSemanticNode = (maxDepth: number): fc.Arbitrary<SemanticNode> => {
      if (maxDepth <= 0) {
        return fc
          .record({
            type: arbNodeType,
            name: arbNodeName,
            content: arbContent,
          })
          .map(({ type, name, content }) => createSemanticNode(type, name, content, []));
      }

      return fc
        .record({
          type: arbNodeType,
          name: arbNodeName,
          content: arbContent,
          children: fc.array(arbSemanticNode(maxDepth - 1), { maxLength: 3 }),
        })
        .map(({ type, name, content, children }) =>
          createSemanticNode(type, name, content, children)
        );
    };

    it('should produce identical hashes for identical trees (determinism)', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(3), { minLength: 1, maxLength: 5 }), (nodes) => {
          const { roots: roots1 } = builder.build(nodes);
          const { roots: roots2 } = builder.build(nodes);

          expect(roots1).toHaveLength(roots2.length);
          for (let i = 0; i < roots1.length; i++) {
            expect(roots1[i].merkleHash).toBe(roots2[i].merkleHash);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should produce different hashes when content changes', () => {
      fc.assert(
        fc.property(
          arbNodeType,
          arbNodeName,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (type, name, content1, content2) => {
            fc.pre(content1 !== content2); // Precondition: contents must differ

            const nodes1 = [createSemanticNode(type, name, content1, [])];
            const nodes2 = [createSemanticNode(type, name, content2, [])];

            const { roots: roots1 } = builder.build(nodes1);
            const { roots: roots2 } = builder.build(nodes2);

            expect(roots1[0].merkleHash).not.toBe(roots2[0].merkleHash);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always propagate child changes to parent hash', () => {
      fc.assert(
        fc.property(
          arbNodeName,
          arbContent,
          arbNodeName,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (parentName, parentContent, childName, childContent1, childContent2) => {
            fc.pre(childContent1 !== childContent2);

            const parent1 = createSemanticNode('class', parentName, parentContent, [
              createSemanticNode('method', childName, childContent1, []),
            ]);
            const parent2 = createSemanticNode('class', parentName, parentContent, [
              createSemanticNode('method', childName, childContent2, []),
            ]);

            const { roots: roots1 } = builder.build([parent1]);
            const { roots: roots2 } = builder.build([parent2]);

            // Parent hashes must differ when child differs
            expect(roots1[0].merkleHash).not.toBe(roots2[0].merkleHash);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify() always returns true for freshly built trees', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(3), { minLength: 0, maxLength: 5 }), (nodes) => {
          const { roots } = builder.build(nodes);
          const isValid = builder.verify(roots);

          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly count total nodes in statistics', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(2), { minLength: 1, maxLength: 5 }), (nodes) => {
          const { stats } = builder.build(nodes);

          // Count nodes manually
          const countNodes = (nodeList: SemanticNode[]): number => {
            return nodeList.reduce((sum, node) => {
              return sum + 1 + countNodes(node.children);
            }, 0);
          };

          const expectedCount = countNodes(nodes);
          expect(stats.totalNodes).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly count leaf nodes in statistics', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(2), { minLength: 1, maxLength: 5 }), (nodes) => {
          const { stats } = builder.build(nodes);

          // Count leaf nodes manually
          const countLeaves = (nodeList: SemanticNode[]): number => {
            return nodeList.reduce((sum, node) => {
              if (node.children.length === 0) return sum + 1;
              return sum + countLeaves(node.children);
            }, 0);
          };

          const expectedLeaves = countLeaves(nodes);
          expect(stats.leafNodes).toBe(expectedLeaves);
        }),
        { numRuns: 100 }
      );
    });

    it('should respect maxDepth configuration', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), arbSemanticNode(5), (maxDepth, node) => {
          const constrainedBuilder = new MerkleTreeBuilder({ maxDepth });

          // Deep tree should either build within limit or throw
          try {
            const { roots } = constrainedBuilder.build([node]);

            // If it built, verify depth doesn't exceed limit
            const getMaxDepth = (nodes: MerkleNode[], depth = 0): number => {
              if (nodes.length === 0) return depth;
              return Math.max(...nodes.map((n) => getMaxDepth(n.children, depth + 1)));
            };

            const actualDepth = getMaxDepth(roots);
            expect(actualDepth).toBeLessThanOrEqual(maxDepth);
          } catch (error) {
            // Should throw if tree is too deep
            expect(error).toBeDefined();
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should compare() detect all node additions', () => {
      fc.assert(
        fc.property(
          fc.array(arbSemanticNode(2), { minLength: 1, maxLength: 3 }),
          arbSemanticNode(1),
          (oldNodes, newNode) => {
            const { roots: oldRoots } = builder.build(oldNodes);
            const { roots: newRoots } = builder.build([...oldNodes, newNode]);

            const comparison = builder.compare(oldRoots, newRoots);

            // Should detect at least one addition
            expect(comparison.added.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should compare() be symmetric for additions/removals', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(2), { minLength: 1, maxLength: 4 }), (nodes) => {
          const { roots: roots1 } = builder.build(nodes);
          const { roots: roots2 } = builder.build(nodes.slice(0, -1)); // Remove last

          const forward = builder.compare(roots1, roots2);
          const backward = builder.compare(roots2, roots1);

          // Removed in forward should equal added in backward
          expect(forward.removed.length).toBe(backward.added.length);
          expect(forward.added.length).toBe(backward.removed.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should findChangedSubtrees() return empty for identical trees', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(3), { minLength: 0, maxLength: 5 }), (nodes) => {
          const { roots: roots1 } = builder.build(nodes);
          const { roots: roots2 } = builder.build(nodes);

          const changes = builder.findChangedSubtrees(roots1, roots2);

          expect(changes).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should findChangedSubtrees() detect modifications correctly', () => {
      fc.assert(
        fc.property(
          arbNodeName,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (name, content1, content2) => {
            fc.pre(content1 !== content2);

            const nodes1 = [createSemanticNode('function', name, content1, [])];
            const nodes2 = [createSemanticNode('function', name, content2, [])];

            const { roots: roots1 } = builder.build(nodes1);
            const { roots: roots2 } = builder.build(nodes2);

            const changes = builder.findChangedSubtrees(roots1, roots2);

            // Should detect exactly one modification
            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some((c) => c.changeType === 'modified')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should computeRootHash() be deterministic', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(2), { minLength: 1, maxLength: 5 }), (nodes) => {
          const { roots } = builder.build(nodes);

          const hash1 = builder.computeRootHash(roots);
          const hash2 = builder.computeRootHash(roots);

          expect(hash1).toBe(hash2);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain structural invariants across all builds', () => {
      fc.assert(
        fc.property(fc.array(arbSemanticNode(3), { minLength: 1, maxLength: 5 }), (nodes) => {
          const { roots, stats } = builder.build(nodes);

          // Verify all nodes have required properties
          const verifyNodeStructure = (node: MerkleNode): boolean => {
            return (
              node.type !== undefined &&
              node.name !== undefined &&
              node.contentHash !== undefined &&
              node.merkleHash !== undefined &&
              Array.isArray(node.children) &&
              node.children.every(verifyNodeStructure)
            );
          };

          expect(roots.every(verifyNodeStructure)).toBe(true);
          expect(stats.totalNodes).toBeGreaterThan(0);
          expect(stats.maxDepth).toBeGreaterThanOrEqual(0);
          expect(stats.leafNodes).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
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
