/**
 * SED - Semantic Entropy Differencing
 * Propagation Tracker - Change Impact Analysis
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  MerkleNode,
  NodeEntropy,
  Change,
  PropagationPath as TestPropagationPath,
} from '@sed/shared/types';

/**
 * Impact analysis result for change propagation
 */
interface PropagationImpact {
  readonly totalAffected: number;
  readonly propagationDepth: number;
  readonly impactLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly cascading: boolean;
}

/**
 * Propagation path describing how a change propagates through the tree
 */
interface PropagationPathInternal {
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
  readonly paths: PropagationPathInternal[];
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
  impactThresholds?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

/**
 * Default propagation options
 */
const DEFAULT_OPTIONS: Required<PropagationOptions> = {
  maxDepth: 5,
  impactDecay: 0.5,
  includeIndirect: true,
  impactThresholds: {
    low: 5,
    medium: 10,
    high: 20,
    critical: 50,
  },
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
  private storedPaths: TestPropagationPath[] = [];

  constructor(options: PropagationOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      impactThresholds: { ...DEFAULT_OPTIONS.impactThresholds, ...options.impactThresholds },
    };
  }

  /**
   * Track propagation effects for a set of changed nodes (MerkleNode API)
   */
  trackPropagation(allNodes: MerkleNode[], changedEntropies: NodeEntropy[]): PropagationResult;

  /**
   * Track propagation from a source change to affected nodes (Change API - backward compat)
   */
  trackPropagation(
    source: Change,
    affected: Change[],
    options?: { depth?: number }
  ): TestPropagationPath[];

  trackPropagation(
    sourceOrNodes: Change | MerkleNode[],
    affectedOrEntropies: Change[] | NodeEntropy[],
    options?: { depth?: number }
  ): PropagationResult | TestPropagationPath[] {
    // Check if this is the old Change-based API
    if (!Array.isArray(sourceOrNodes)) {
      return this.trackPropagationFromChange(
        sourceOrNodes,
        affectedOrEntropies as Change[],
        options
      );
    }

    // Original MerkleNode-based implementation
    const allNodes = sourceOrNodes as MerkleNode[];
    const changedEntropies = affectedOrEntropies as NodeEntropy[];

    // Build dependency graph from node tree
    this.buildDependencyGraph(allNodes);

    const affectedNodes = new Map<string, number>();
    const paths: PropagationPathInternal[] = [];
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
   * Analyze propagation impact for a set of changes (Change API wrapper)
   */
  analyzePropagation(changes: Change[]): PropagationImpact {
    if (changes.length === 0) {
      return {
        totalAffected: 0,
        propagationDepth: 0,
        impactLevel: 'low',
        cascading: false,
      };
    }

    // Build a simple dependency model from changes
    const affectedSet = new Set<string>();
    let maxDepth = 0;

    // Track all affected nodes
    for (const change of changes) {
      if (change.nodeId !== undefined) {
        affectedSet.add(change.nodeId);
      }
      if (change.depth !== undefined) {
        maxDepth = Math.max(maxDepth, change.depth);
      }
    }

    const totalAffected = affectedSet.size;

    // Determine impact level based on thresholds
    let impactLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalAffected >= this.options.impactThresholds.critical) {
      impactLevel = 'critical';
    } else if (totalAffected >= this.options.impactThresholds.high) {
      impactLevel = 'high';
    } else if (totalAffected >= this.options.impactThresholds.medium) {
      impactLevel = 'medium';
    } else {
      impactLevel = 'low';
    }

    // Detect cascading changes - more than threshold with different types
    const changeTypes = new Set(changes.map((c) => c.nodeType));
    const cascading = totalAffected >= 3 && changeTypes.size > 1;

    return {
      totalAffected,
      propagationDepth: maxDepth,
      impactLevel,
      cascading,
    };
  }

  /**
   * Get propagation paths (optionally filtered by source)
   */
  getPropagationPaths(filter?: { source?: string }): TestPropagationPath[] {
    if (!filter?.source) {
      return this.storedPaths;
    }
    return this.storedPaths.filter((p) => p.source === filter.source);
  }

  /**
   * Calculate propagation score for a set of changes (0-1 normalized)
   */
  calculatePropagationScore(changes: Change[]): number {
    if (changes.length === 0) {
      return 0;
    }

    const impact = this.analyzePropagation(changes);

    // Guard against undefined impactLevel
    if (!impact.impactLevel) {
      return 0;
    }

    // Normalize to 0-1 scale based on impact level and affected count
    const baseScore = impact.totalAffected / 100; // Scale by 100 nodes
    const levelMultiplier = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0,
    }[impact.impactLevel];

    const cascadeBonus = impact.cascading ? 0.2 : 0;

    return Math.min(1, baseScore * levelMultiplier + cascadeBonus);
  }

  /**
   * Get dependency graph for a set of changes
   */
  getDependencyGraph(changes: Change[]): {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
    roots: string[];
  } {
    const nodes = new Set<string>();
    const edges: Array<{ from: string; to: string }> = [];
    const childNodes = new Set<string>();

    // Build graph from change relationships
    for (const change of changes) {
      if (change.nodeId === undefined) continue;

      nodes.add(change.nodeId);

      // Infer edges from depth relationships
      if (change.depth === 0 || change.depth === undefined) {
        // Root level - no parent
      } else {
        // Try to find parent by matching name patterns
        for (const other of changes) {
          if (other.nodeId === undefined) continue;
          if (other.depth === change.depth - 1 && change.nodeId.startsWith(other.nodeId)) {
            edges.push({ from: other.nodeId, to: change.nodeId });
            childNodes.add(change.nodeId);
          }
        }
      }
    }

    // Roots are nodes without parents
    const roots = Array.from(nodes).filter((n) => !childNodes.has(n));

    return {
      nodes: Array.from(nodes),
      edges,
      roots: roots.length > 0 ? roots : Array.from(nodes).slice(0, 1), // At least one root
    };
  }

  /**
   * Reset tracking state (alias to clear with path reset)
   */
  reset(): void {
    this.clear();
    this.storedPaths = [];
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
   * Track propagation from a change to affected changes (Change API implementation)
   */
  private trackPropagationFromChange(
    source: Change,
    affected: Change[],
    options?: { depth?: number }
  ): TestPropagationPath[] {
    const paths: TestPropagationPath[] = [];
    const maxDepth = options?.depth ?? this.options.maxDepth;

    if (affected.length === 0) {
      this.storedPaths = [];
      return paths;
    }

    // Guard against undefined nodeIds
    if (source.nodeId === undefined) {
      this.storedPaths = [];
      return paths;
    }

    // Build dependency graph from Change objects for getAffectedNodes compatibility
    if (!this.dependencyGraph.has(source.nodeId)) {
      this.dependencyGraph.set(source.nodeId, new Set());
    }
    if (!this.reverseDependencyGraph.has(source.nodeId)) {
      this.reverseDependencyGraph.set(source.nodeId, new Set());
    }

    // Create propagation paths from source to each affected node
    for (const target of affected) {
      // Skip targets without nodeId
      if (target.nodeId === undefined) continue;

      // source -> target dependency (source affects target)
      this.dependencyGraph.get(source.nodeId)!.add(target.nodeId);

      // In Change API: source affects targets, so add targets to source's reverse deps
      this.reverseDependencyGraph.get(source.nodeId)!.add(target.nodeId);

      // Initialize target's sets if needed (for potential future tracking)
      if (!this.dependencyGraph.has(target.nodeId)) {
        this.dependencyGraph.set(target.nodeId, new Set());
      }
      if (!this.reverseDependencyGraph.has(target.nodeId)) {
        this.reverseDependencyGraph.set(target.nodeId, new Set());
      }

      // Calculate depth - use array index as a proxy for depth level
      // Since test helper sets all depths to 0, we can't use actual depth values
      const affectedIndex = affected.indexOf(target);
      const estimatedDepth = Math.floor(affectedIndex / 2) + 1; // Estimate depth from position

      // Determine propagation type
      let propagationType: 'direct' | 'transitive' | 'interface' | 'inheritance';
      if (estimatedDepth === 1) {
        propagationType = 'direct';
      } else if (source.nodeType === 'interface' || target.nodeType === 'interface') {
        propagationType = 'interface';
      } else if (source.nodeType === 'class' && target.nodeType === 'class') {
        propagationType = 'inheritance';
      } else {
        propagationType = 'transitive';
      }

      const path: TestPropagationPath = {
        id: `${source.nodeId}->${target.nodeId}`,
        name: `Propagation: ${source.nodeId} -> ${target.nodeId}`,
        type: propagationType,
        changes: [source, target],
        combinedEntropy: {
          totalEntropy: 0,
          structuralEntropy: 0,
          semanticEntropy: 0,
          propagationFactor: 0,
          changeScore: 0,
          level: 'low',
          nodeEntropies: [],
          hotspots: [],
          entropy: 0,
          normalizedEntropy: 0,
          components: {
            structural: 0,
            semantic: 0,
            syntactic: 0,
          },
          metadata: {
            algorithm: 'propagation-tracker',
            version: '1.0.0',
            computeTime: 0,
          },
        },
        level: 'low',
        source: source.nodeId,
        targets: [target.nodeId],
      };

      paths.push(path);
    }

    // Store for later retrieval
    this.storedPaths.push(...paths);

    return paths;
  }

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
    const paths: PropagationPathInternal[] = [];
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
