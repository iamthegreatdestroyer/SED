/**
 * SED - Semantic Entropy Differencing
 * Merkle Tree Builder for Semantic Nodes
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SemanticNode, MerkleNode } from '@sed/shared/types';
import { sha256, combineHashes, structuralHash, contentHash } from '@sed/shared/utils';

/**
 * Options for Merkle tree construction
 */
interface MerkleTreeOptions {
  /**
   * Include structural information in hash calculation
   * Default: true
   */
  includeStructure?: boolean;

  /**
   * Include content hashes in calculation
   * Default: true
   */
  includeContent?: boolean;

  /**
   * Maximum tree depth to process
   * Default: 100
   */
  maxDepth?: number;
}

/**
 * Statistics about the Merkle tree
 */
interface MerkleTreeStats {
  totalNodes: number;
  maxDepth: number;
  leafNodes: number;
  internalNodes: number;
  buildTime: number;
}

/**
 * Default options for Merkle tree construction
 */
const DEFAULT_OPTIONS: Required<MerkleTreeOptions> = {
  includeStructure: true,
  includeContent: true,
  maxDepth: 100,
};

/**
 * Merkle Tree Builder for Semantic AST
 *
 * Creates a Merkle tree from semantic nodes where each node's hash
 * is computed from its own content and its children's hashes.
 *
 * Hash Formula:
 * H(node) = SHA256(structuralHash || contentHash || H(child₁) || H(child₂) || ... || H(childₙ))
 */
export class MerkleTreeBuilder {
  private readonly options: Required<MerkleTreeOptions>;

  constructor(options: MerkleTreeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Build a Merkle tree from semantic nodes
   *
   * @param nodes Array of semantic nodes (assumed to be hierarchical)
   * @returns Root of the Merkle tree and statistics
   */
  build(nodes: SemanticNode[]): { roots: MerkleNode[]; stats: MerkleTreeStats } {
    const startTime = performance.now();
    let totalNodes = 0;
    let maxDepth = 0;
    let leafNodes = 0;

    const buildMerkleNode = (node: SemanticNode, depth: number): MerkleNode => {
      if (depth > this.options.maxDepth) {
        throw new Error(`Maximum tree depth (${this.options.maxDepth}) exceeded`);
      }

      totalNodes++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }

      // Recursively build children first (post-order traversal)
      const merkleChildren = node.children.map((child) => buildMerkleNode(child, depth + 1));

      // Build hash components
      const hashComponents: string[] = [];

      // Add structural hash
      if (this.options.includeStructure) {
        hashComponents.push(this.computeStructuralHash(node));
      }

      // Add content hash
      if (this.options.includeContent) {
        hashComponents.push(node.contentHash);
      }

      // Add children hashes (in order)
      for (const child of merkleChildren) {
        hashComponents.push(child.merkleHash);
      }

      // Compute final Merkle hash
      const merkleHash = this.computeMerkleHash(hashComponents);

      // Track leaf nodes
      if (merkleChildren.length === 0) {
        leafNodes++;
      }

      return {
        hash: merkleHash,
        merkleHash,
        semanticNode: node,
        contentHash: node.contentHash,
        structuralHash: this.computeStructuralHash(node),
        children: merkleChildren,
        id: node.id,
        name: node.name,
        type: node.type,
        startLine: node.startLine,
        endLine: node.endLine,
        depth,
      };
    };

    // Build Merkle nodes from all root semantic nodes
    const roots = nodes.map((node) => buildMerkleNode(node, 0));

    const buildTime = performance.now() - startTime;

    return {
      roots,
      stats: {
        totalNodes,
        maxDepth,
        leafNodes,
        internalNodes: totalNodes - leafNodes,
        buildTime,
      },
    };
  }

  /**
   * Compare two Merkle trees and find differences
   *
   * @param oldRoots Roots of the old Merkle tree
   * @param newRoots Roots of the new Merkle tree
   * @returns Object containing added, removed, and modified nodes
   */
  compare(
    oldRoots: MerkleNode[],
    newRoots: MerkleNode[]
  ): {
    added: MerkleNode[];
    removed: MerkleNode[];
    modified: Array<{ old: MerkleNode; new: MerkleNode }>;
    unchanged: MerkleNode[];
  } {
    const oldMap = this.buildNodeMap(oldRoots);
    const newMap = this.buildNodeMap(newRoots);

    const added: MerkleNode[] = [];
    const removed: MerkleNode[] = [];
    const modified: Array<{ old: MerkleNode; new: MerkleNode }> = [];
    const unchanged: MerkleNode[] = [];

    // Find added and modified nodes
    for (const [key, newNode] of newMap) {
      const oldNode = oldMap.get(key);
      if (!oldNode) {
        added.push(newNode);
      } else if (oldNode.merkleHash !== newNode.merkleHash) {
        modified.push({ old: oldNode, new: newNode });
      } else {
        unchanged.push(newNode);
      }
    }

    // Find removed nodes
    for (const [key, oldNode] of oldMap) {
      if (!newMap.has(key)) {
        removed.push(oldNode);
      }
    }

    return { added, removed, modified, unchanged };
  }

  /**
   * Find the minimal set of changed subtrees
   * Uses Merkle hash comparison to quickly identify unchanged branches
   */
  findChangedSubtrees(
    oldRoots: MerkleNode[],
    newRoots: MerkleNode[]
  ): {
    path: string[];
    oldNode?: MerkleNode;
    newNode?: MerkleNode;
    changeType: 'added' | 'removed' | 'modified';
  }[] {
    const changes: {
      path: string[];
      oldNode?: MerkleNode;
      newNode?: MerkleNode;
      changeType: 'added' | 'removed' | 'modified';
    }[] = [];

    const findChanges = (oldNodes: MerkleNode[], newNodes: MerkleNode[], path: string[]): void => {
      const oldByName = new Map(oldNodes.map((n) => [n.name, n]));
      const newByName = new Map(newNodes.map((n) => [n.name, n]));

      // Check for additions and modifications
      for (const [name, newNode] of newByName) {
        const oldNode = oldByName.get(name);
        const nodePath = [...path, name];

        if (!oldNode) {
          changes.push({ path: nodePath, newNode, changeType: 'added' });
        } else if (oldNode.merkleHash !== newNode.merkleHash) {
          // Hash differs - check if it's content or children
          if (oldNode.contentHash !== newNode.contentHash) {
            changes.push({ path: nodePath, oldNode, newNode, changeType: 'modified' });
          } else {
            // Content is same, difference is in children - recurse
            findChanges([...oldNode.children], [...newNode.children], nodePath);
          }
        }
        // If hashes match, entire subtree is unchanged - skip
      }

      // Check for removals
      for (const [name, oldNode] of oldByName) {
        if (!newByName.has(name)) {
          changes.push({ path: [...path, name], oldNode, changeType: 'removed' });
        }
      }
    };

    findChanges(oldRoots, newRoots, []);
    return changes;
  }

  /**
   * Compute a root hash for the entire tree
   */
  computeRootHash(roots: MerkleNode[]): string {
    if (roots.length === 0) {
      return sha256('empty');
    }

    if (roots.length === 1) {
      return roots[0]!.merkleHash;
    }

    // Combine all root hashes
    const hashes = roots.map((r) => r.merkleHash);
    return combineHashes(...hashes);
  }

  /**
   * Verify the integrity of a Merkle tree
   */
  verify(roots: MerkleNode[]): boolean {
    const verifyNode = (node: MerkleNode): boolean => {
      // Verify children first
      for (const child of node.children) {
        if (!verifyNode(child)) {
          return false;
        }
      }

      // Recompute hash and compare
      const hashComponents: string[] = [];

      if (this.options.includeStructure) {
        hashComponents.push(node.structuralHash);
      }

      if (this.options.includeContent) {
        hashComponents.push(node.contentHash);
      }

      for (const child of node.children) {
        hashComponents.push(child.merkleHash);
      }

      const expectedHash = this.computeMerkleHash(hashComponents);
      return expectedHash === node.merkleHash;
    };

    return roots.every(verifyNode);
  }

  /**
   * Compute structural hash for a semantic node
   */
  private computeStructuralHash(node: SemanticNode): string {
    const depth = this.getNodeDepth(node);
    return structuralHash({
      type: node.type,
      childTypes: node.children.map((c) => c.type),
      depth,
    });
  }

  /**
   * Calculate the depth of a node in the semantic tree
   */
  private getNodeDepth(node: SemanticNode): number {
    if (node.children.length === 0) {
      return 0;
    }
    return 1 + Math.max(...node.children.map((c) => this.getNodeDepth(c)));
  }

  /**
   * Compute Merkle hash from components
   */
  private computeMerkleHash(components: string[]): string {
    if (components.length === 0) {
      return sha256('empty-node');
    }

    if (components.length === 1) {
      return sha256(components[0]!);
    }

    return combineHashes(...components);
  }

  /**
   * Build a map of nodes by their identifying key (type + name)
   */
  private buildNodeMap(roots: MerkleNode[]): Map<string, MerkleNode> {
    const map = new Map<string, MerkleNode>();

    const addToMap = (node: MerkleNode, path: string): void => {
      const key = `${path}/${node.type}:${node.name}`;
      map.set(key, node);

      for (const child of node.children) {
        addToMap(child, key);
      }
    };

    for (const root of roots) {
      addToMap(root, '');
    }

    return map;
  }
}
