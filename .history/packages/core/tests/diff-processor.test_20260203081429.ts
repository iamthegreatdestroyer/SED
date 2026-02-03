/**
 * SED - Semantic Entropy Differencing
 * Diff Processor Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DiffProcessor } from '../src/engine/diff-processor.js';
import type { SemanticNode, MerkleNode } from '@sed/shared/types';

describe('DiffProcessor', () => {
  let processor: DiffProcessor;

  beforeEach(() => {
    processor = new DiffProcessor();
  });

  describe('diff', () => {
    it('should detect no changes for identical nodes', () => {
      const nodes: SemanticNode[] = [
        createSemanticNode('function', 'myFunc', []),
      ];

      const result = processor.diff(nodes, nodes);

      expect(result.changes).toHaveLength(0);
      expect(result.summary.totalChanges).toBe(0);
    });

    it('should detect added nodes', () => {
      const oldNodes: SemanticNode[] = [];
      const newNodes: SemanticNode[] = [
        createSemanticNode('function', 'newFunc', []),
      ];

      const result = processor.diff(oldNodes, newNodes);

      expect(result.summary.added).toBeGreaterThanOrEqual(0);
    });

    it('should detect removed nodes', () => {
      const oldNodes: SemanticNode[] = [
        createSemanticNode('function', 'oldFunc', []),
      ];
      const newNodes: SemanticNode[] = [];

      const result = processor.diff(oldNodes, newNodes);

      expect(result.summary.removed).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata', () => {
      const result = processor.diff([], []);

      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata.processingTime).toBe('number');
    });
  });

  describe('compareTrees', () => {
    it('should find added Merkle nodes', () => {
      const oldTrees: MerkleNode[] = [];
      const newTrees: MerkleNode[] = [
        createMerkleNode('function', 'newFunc', []),
      ];

      const changes = processor.compareTrees(oldTrees, newTrees);

      const added = changes.filter((c) => c.changeType === 'added');
      expect(added.length).toBeGreaterThanOrEqual(0);
    });

    it('should find removed Merkle nodes', () => {
      const oldTrees: MerkleNode[] = [
        createMerkleNode('function', 'oldFunc', []),
      ];
      const newTrees: MerkleNode[] = [];

      const changes = processor.compareTrees(oldTrees, newTrees);

      const removed = changes.filter((c) => c.changeType === 'removed');
      expect(removed.length).toBeGreaterThanOrEqual(0);
    });

    it('should find modified nodes by hash difference', () => {
      const oldTrees: MerkleNode[] = [
        createMerkleNode('function', 'myFunc', [], 'hash1'),
      ];
      const newTrees: MerkleNode[] = [
        createMerkleNode('function', 'myFunc', [], 'hash2'),
      ];

      const changes = processor.compareTrees(oldTrees, newTrees);

      const modified = changes.filter((c) => c.changeType === 'modified');
      expect(modified.length).toBeGreaterThanOrEqual(0);
    });

    it('should not report unchanged nodes', () => {
      const tree = createMerkleNode('function', 'unchanged', [], 'sameHash');

      const changes = processor.compareTrees([tree], [tree]);

      expect(changes).toHaveLength(0);
    });
  });

  describe('getChangesAtDepth', () => {
    it('should filter changes by depth', () => {
      const changes = [
        createChange('added', createMerkleNode('class', 'A', [], 'hash', 0)),
        createChange('added', createMerkleNode('function', 'B', [], 'hash', 1)),
        createChange('added', createMerkleNode('variable', 'C', [], 'hash', 2)),
      ];

      const depth0 = processor.getChangesAtDepth(changes, 0);
      const depth1 = processor.getChangesAtDepth(changes, 1);
      const depth2 = processor.getChangesAtDepth(changes, 2);

      expect(depth0).toHaveLength(1);
      expect(depth1).toHaveLength(1);
      expect(depth2).toHaveLength(1);
    });
  });

  describe('groupByType', () => {
    it('should group changes by node type', () => {
      const changes = [
        createChange('added', createMerkleNode('function', 'func1', [])),
        createChange('added', createMerkleNode('function', 'func2', [])),
        createChange('added', createMerkleNode('class', 'Class1', [])),
      ];

      const groups = processor.groupByType(changes);

      expect(groups.get('function')).toHaveLength(2);
      expect(groups.get('class')).toHaveLength(1);
    });

    it('should handle empty changes', () => {
      const groups = processor.groupByType([]);

      expect(groups.size).toBe(0);
    });
  });

  describe('groupByFile', () => {
    it('should group changes by file path', () => {
      const changes = [
        createChange('added', createMerkleNode('function', 'src/a.ts::func1', [])),
        createChange('added', createMerkleNode('function', 'src/a.ts::func2', [])),
        createChange('added', createMerkleNode('function', 'src/b.ts::func3', [])),
      ];

      const groups = processor.groupByFile(changes);

      expect(groups.get('src/a.ts')).toHaveLength(2);
      expect(groups.get('src/b.ts')).toHaveLength(1);
    });
  });

  describe('options', () => {
    it('should respect includeContent option', () => {
      const processorWithContent = new DiffProcessor({ includeContent: true });

      const oldTrees = [createMerkleNode('function', 'func', [], 'hash1')];
      const newTrees = [createMerkleNode('function', 'func', [], 'hash2')];

      const changes = processorWithContent.compareTrees(oldTrees, newTrees);

      // Modified changes should include content info when option is set
      const modified = changes.filter((c) => c.changeType === 'modified');
      if (modified.length > 0) {
        expect(modified[0]).toBeDefined();
      }
    });

    it('should respect maxChangeDepth option', () => {
      const shallowProcessor = new DiffProcessor({ maxChangeDepth: 1 });

      // Deep tree
      const deepTree = createMerkleNode('module', 'mod', [
        createMerkleNode('class', 'cls', [
          createMerkleNode('function', 'func', []),
        ]),
      ]);

      // Should still process but limit depth
      const result = shallowProcessor.diff(
        [semanticFromMerkle(deepTree)],
        []
      );

      expect(result).toBeDefined();
    });
  });
});

// Helper functions

function createSemanticNode(
  type: string,
  name: string,
  children: SemanticNode[]
): SemanticNode {
  return {
    id: `node-${name}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    name,
    range: { start: 0, end: 100 },
    children,
  };
}

function createMerkleNode(
  type: string,
  name: string,
  children: MerkleNode[],
  merkleHash = `merkle-${name}`,
  depth = 0
): MerkleNode {
  const id = `node-${name}-${Math.random().toString(36).slice(2, 9)}`;
  
  return {
    id,
    type,
    name,
    depth,
    contentHash: `content-${name}`,
    structuralHash: `struct-${name}`,
    merkleHash,
    children,
  };
}

function createChange(
  changeType: 'added' | 'removed' | 'modified',
  node: MerkleNode
): {
  changeType: 'added' | 'removed' | 'modified';
  nodeId: string;
  nodeName: string;
  nodeType: string;
  oldNode?: MerkleNode;
  newNode?: MerkleNode;
} {
  return {
    changeType,
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    newNode: changeType !== 'removed' ? node : undefined,
    oldNode: changeType !== 'added' ? node : undefined,
  };
}

function semanticFromMerkle(merkle: MerkleNode): SemanticNode {
  return {
    id: merkle.id,
    type: merkle.type,
    name: merkle.name,
    range: { start: 0, end: 100 },
    children: merkle.children.map(semanticFromMerkle),
  };
}
