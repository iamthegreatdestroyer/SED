/**
 * SED - Semantic Entropy Differencing
 * Propagation Tracker - Change Impact Analysis
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { MerkleNode, NodeEntropy } from '@sed/shared/types';

/**
 * Propagation path describing how a change propagates through the tree
 */
interface PropagationPath {
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly path: string[];
  readonly distance: number;
  readonly impactScore: number;
}

/**
 * Result of propagation analysis
 */
interface PropagationResult {
  readonly affectedNodes: Map<string, number>;
  readonly paths: PropagationPath[];
  readonly maxDistance: number;
  readonly totalImpact: number;
}

/**
 * Options for propagation tracking
 */
interface PropagationOptions {
  maxDepth?: number;
  impactDecay?: number;
  includeIndirect?: boolean;
}

/**
 * Default propagation options
 */
const DEFAULT_OPTIONS: Required<PropagationOptions> = {
  maxDepth: 5,
  impactDecay: 0.5,
  includeIndirect: true,
};

/**
 * Propagation Tracker
 *
 * Tracks how changes propagate through the semantic tree,
 * estimating the impact on dependent code.
 */
export class PropagationTracker {
  private readonly options: Required<PropagationOptions>;
  private readonly dependencyGraph = new Map<string, Set<string>>();
  private readonly reverseDependencyGraph = new Map<string, Set<string>>();

  constructor(options: PropagationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Track propagation effects for a set of changed nodes
   */
  trackPropagation(allNodes: MerkleNode[], changedEntropies: NodeEntropy[]): PropagationResult {
    // Build dependency graph from node tree
    this.buildDependencyGraph(allNodes);

    const affectedNodes = new Map<string, number>();
    const paths: PropagationPath[] = [];
    let maxDistance = 0;
    let totalImpact = 0;

    // For each changed node, trace propagation
    for (const entropy of changedEntropies) {
      if (entropy.changeType === 'unchanged') {
        continue;
      }

      const propagation = this.tracePropagation(entropy.nodeId, entropy.normalizedEntropy);

      // Merge affected nodes
      for (const [nodeId, impact] of propagation.affectedNodes) {
        const existing = affectedNodes.get(nodeId) ?? 0;
        affectedNodes.set(nodeId, Math.max(existing, impact));
      }

      paths.push(...propagation.paths);
      maxDistance = Math.max(maxDistance, propagation.maxDistance);
      totalImpact += propagation.totalImpact;
    }

    return {
      affectedNodes,
      paths,
      maxDistance,
      totalImpact,
    };
  }

  /**
   * Get nodes affected by a specific change
   */
  getAffectedNodes(nodeId: string): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const visit = (id: string, depth: number): void => {
      if (visited.has(id) || depth > this.options.maxDepth) {
        return;
      }

      visited.add(id);
      affected.add(id);

      const dependents = this.reverseDependencyGraph.get(id);
      if (dependents) {
        for (const dependent of dependents) {
          visit(dependent, depth + 1);
        }
      }
    };

    // Start with direct dependents
    const directDependents = this.reverseDependencyGraph.get(nodeId);
    if (directDependents) {
      for (const dependent of directDependents) {
        visit(dependent, 1);
      }
    }

    return Array.from(affected);
  }

  /**
   * Calculate propagation factor for a node
   */
  calculatePropagationFactor(nodeId: string): number {
    const dependents = this.getAffectedNodes(nodeId);

    if (dependents.length === 0) {
      return 1;
    }

    // Base factor on number of dependents with distance decay
    let factor = 1;
    const visited = new Set<string>();

    const calculate = (id: string, depth: number): void => {
      if (visited.has(id) || depth > this.options.maxDepth) {
        return;
      }

      visited.add(id);
      factor += Math.pow(this.options.impactDecay, depth);

      const deps = this.reverseDependencyGraph.get(id);
      if (deps) {
        for (const dep of deps) {
          calculate(dep, depth + 1);
        }
      }
    };

    const directDeps = this.reverseDependencyGraph.get(nodeId);
    if (directDeps) {
      for (const dep of directDeps) {
        calculate(dep, 1);
      }
    }

    return factor;
  }

  /**
   * Clear the dependency graphs
   */
  clear(): void {
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
  }

  // Private methods

  /**
   * Build dependency graph from Merkle node tree
   */
  private buildDependencyGraph(nodes: MerkleNode[]): void {
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    const processNode = (node: MerkleNode, parent?: MerkleNode): void => {
      // Initialize sets if needed
      if (!this.dependencyGraph.has(node.id)) {
        this.dependencyGraph.set(node.id, new Set());
      }
      if (!this.reverseDependencyGraph.has(node.id)) {
        this.reverseDependencyGraph.set(node.id, new Set());
      }

      // If there's a parent, create dependency relationship
      if (parent) {
        // Child depends on parent
        this.dependencyGraph.get(node.id)!.add(parent.id);
        // Parent is a dependent of child changes
        this.reverseDependencyGraph.get(node.id)!.add(parent.id);
      }

      // Process children
      for (const child of node.children) {
        processNode(child, node);

        // Parent depends on children (changes flow up)
        this.dependencyGraph.get(node.id)!.add(child.id);
      }
    };

    for (const node of nodes) {
      processNode(node);
    }
  }

  /**
   * Trace propagation from a changed node
   */
  private tracePropagation(sourceId: string, initialImpact: number): PropagationResult {
    const affectedNodes = new Map<string, number>();
    const paths: PropagationPath[] = [];
    let maxDistance = 0;
    let totalImpact = initialImpact;

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[]; distance: number; impact: number }> = [];

    // Start with direct dependents
    const directDeps = this.reverseDependencyGraph.get(sourceId);
    if (directDeps) {
      for (const dep of directDeps) {
        queue.push({
          nodeId: dep,
          path: [sourceId, dep],
          distance: 1,
          impact: initialImpact * this.options.impactDecay,
        });
      }
    }

    // BFS through dependents
    while (queue.length > 0) {
      const { nodeId, path, distance, impact } = queue.shift()!;

      if (visited.has(nodeId) || distance > this.options.maxDepth) {
        continue;
      }

      visited.add(nodeId);
      affectedNodes.set(nodeId, impact);
      totalImpact += impact;
      maxDistance = Math.max(maxDistance, distance);

      // Record path
      paths.push({
        sourceNodeId: sourceId,
        targetNodeId: nodeId,
        path,
        distance,
        impactScore: impact,
      });

      // Continue to next level
      if (this.options.includeIndirect) {
        const nextDeps = this.reverseDependencyGraph.get(nodeId);
        if (nextDeps) {
          const nextImpact = impact * this.options.impactDecay;

          // Stop if impact is negligible
          if (nextImpact > 0.01) {
            for (const dep of nextDeps) {
              if (!visited.has(dep)) {
                queue.push({
                  nodeId: dep,
                  path: [...path, dep],
                  distance: distance + 1,
                  impact: nextImpact,
                });
              }
            }
          }
        }
      }
    }

    return {
      affectedNodes,
      paths,
      maxDistance,
      totalImpact,
    };
  }
}
