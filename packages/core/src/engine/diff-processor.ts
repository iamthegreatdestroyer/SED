/**
 * SED - Semantic Entropy Differencing
 * Diff Processor - Semantic Diff Generation
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { MerkleNode, SemanticNode, SemanticDiff, SemanticChange } from '@sed/shared/types';

import { MerkleTreeBuilder } from '../semantic/merkle-tree.js';

/**
 * Options for diff processing
 */
interface DiffOptions {
  includeContent?: boolean;
  maxChangeDepth?: number;
  ignoreWhitespaceOnly?: boolean;
}

/**
 * Default diff options
 */
const DEFAULT_OPTIONS: Required<DiffOptions> = {
  includeContent: false,
  maxChangeDepth: 10,
  ignoreWhitespaceOnly: true,
};

/**
 * Diff Processor
 *
 * Processes semantic differences between code versions using
 * Merkle trees for efficient change detection.
 */
export class DiffProcessor {
  private readonly options: Required<DiffOptions>;
  private readonly merkleBuilder: MerkleTreeBuilder;

  constructor(options: DiffOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.merkleBuilder = new MerkleTreeBuilder();
  }

  /**
   * Generate semantic diff between old and new versions
   */
  diff(oldNodes: SemanticNode[], newNodes: SemanticNode[]): SemanticDiff {
    const startTime = performance.now();

    // Build Merkle trees - build() expects the array of root nodes
    const oldTreeResult = this.merkleBuilder.build(oldNodes);
    const newTreeResult = this.merkleBuilder.build(newNodes);

    // Compare trees using the roots
    const changes = this.compareTrees(oldTreeResult.roots, newTreeResult.roots);

    // Build change summary
    const summary = this.buildSummary(changes);

    const processingTime = performance.now() - startTime;

    return {
      changes,
      summary,
      metadata: {
        oldNodeCount: this.countNodes(oldTreeResult.roots),
        newNodeCount: this.countNodes(newTreeResult.roots),
        processingTime,
      },
    };
  }

  /**
   * Compare two Merkle trees
   */
  compareTrees(oldTrees: MerkleNode[], newTrees: MerkleNode[]): SemanticChange[] {
    const changes: SemanticChange[] = [];

    // Build index by name for matching
    const oldIndex = new Map<string, MerkleNode>();
    const newIndex = new Map<string, MerkleNode>();

    for (const tree of oldTrees) {
      this.indexTree(tree, oldIndex);
    }
    for (const tree of newTrees) {
      this.indexTree(tree, newIndex);
    }

    // Find removed nodes (in old but not in new)
    for (const [name, oldNode] of oldIndex) {
      if (!newIndex.has(name)) {
        changes.push(this.createChange('removed', oldNode, null));
      }
    }

    // Find added nodes (in new but not in old)
    for (const [name, newNode] of newIndex) {
      if (!oldIndex.has(name)) {
        changes.push(this.createChange('added', null, newNode));
      }
    }

    // Find modified nodes (in both but different hash)
    for (const [name, oldNode] of oldIndex) {
      const newNode = newIndex.get(name);
      if (newNode && oldNode.merkleHash !== newNode.merkleHash) {
        changes.push(this.createChange('modified', oldNode, newNode));
      }
    }

    return changes;
  }

  /**
   * Get changes at a specific depth
   */
  getChangesAtDepth(changes: SemanticChange[], depth: number): SemanticChange[] {
    return changes.filter((change) => {
      const node = change.newNode ?? change.oldNode;
      return node?.depth === depth;
    });
  }

  /**
   * Group changes by type
   */
  groupByType(changes: SemanticChange[]): Map<string, SemanticChange[]> {
    const groups = new Map<string, SemanticChange[]>();

    for (const change of changes) {
      const nodeType = change.newNode?.type ?? change.oldNode?.type ?? 'unknown';

      if (!groups.has(nodeType)) {
        groups.set(nodeType, []);
      }
      groups.get(nodeType)!.push(change);
    }

    return groups;
  }

  /**
   * Group changes by file
   */
  groupByFile(changes: SemanticChange[]): Map<string, SemanticChange[]> {
    const groups = new Map<string, SemanticChange[]>();

    for (const change of changes) {
      const node = change.newNode ?? change.oldNode;
      const filePath = node?.name.split('::')[0] ?? 'unknown';

      if (!groups.has(filePath)) {
        groups.set(filePath, []);
      }
      groups.get(filePath)!.push(change);
    }

    return groups;
  }

  // Private methods

  /**
   * Index a tree by node names
   */
  private indexTree(node: MerkleNode, index: Map<string, MerkleNode>, depth = 0): void {
    if (depth > this.options.maxChangeDepth) {
      return;
    }

    // Use qualified name (parent::name) for uniqueness
    const qualifiedName = `${node.type}::${node.name}`;
    index.set(qualifiedName, node);

    for (const child of node.children) {
      this.indexTree(child, index, depth + 1);
    }
  }

  /**
   * Create a semantic change record
   */
  private createChange(
    changeType: 'added' | 'removed' | 'modified',
    oldNode: MerkleNode | null,
    newNode: MerkleNode | null
  ): SemanticChange {
    const node = newNode ?? oldNode!;

    const change: SemanticChange = {
      changeType,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      oldNode: oldNode ?? undefined,
      newNode: newNode ?? undefined,
    };

    // Add content if requested
    if (this.options.includeContent) {
      if (oldNode) {
        change.oldContent = oldNode.contentHash;
      }
      if (newNode) {
        change.newContent = newNode.contentHash;
      }
    }

    // Add modification details
    if (changeType === 'modified' && oldNode && newNode) {
      change.modifications = this.detectModifications(oldNode, newNode);
    }

    return change;
  }

  /**
   * Detect specific modifications between old and new node
   */
  private detectModifications(
    oldNode: MerkleNode,
    newNode: MerkleNode
  ): SemanticChange['modifications'] {
    const modifications: NonNullable<SemanticChange['modifications']> = [];

    // Check content change
    if (oldNode.contentHash !== newNode.contentHash) {
      modifications.push({
        type: 'content',
        description: 'Content has changed',
      });
    }

    // Check structural change
    if (oldNode.structuralHash !== newNode.structuralHash) {
      modifications.push({
        type: 'structure',
        description: 'Structure has changed',
      });
    }

    // Check children changes
    const oldChildCount = oldNode.children.length;
    const newChildCount = newNode.children.length;

    if (oldChildCount !== newChildCount) {
      if (newChildCount > oldChildCount) {
        modifications.push({
          type: 'children_added',
          description: `${newChildCount - oldChildCount} children added`,
        });
      } else {
        modifications.push({
          type: 'children_removed',
          description: `${oldChildCount - newChildCount} children removed`,
        });
      }
    }

    return modifications;
  }

  /**
   * Build summary of changes
   */
  private buildSummary(changes: SemanticChange[]): SemanticDiff['summary'] {
    const byType = this.groupByType(changes);

    const typeCounts: Record<string, number> = {};
    for (const [type, typeChanges] of byType) {
      typeCounts[type] = typeChanges.length;
    }

    return {
      totalChanges: changes.length,
      added: changes.filter((c) => c.changeType === 'added').length,
      removed: changes.filter((c) => c.changeType === 'removed').length,
      modified: changes.filter((c) => c.changeType === 'modified').length,
      byType: typeCounts,
    };
  }

  /**
   * Count total nodes in trees
   */
  private countNodes(trees: MerkleNode[]): number {
    let count = 0;

    const countNode = (node: MerkleNode): void => {
      count++;
      for (const child of node.children) {
        countNode(child);
      }
    };

    for (const tree of trees) {
      countNode(tree);
    }

    return count;
  }
}
