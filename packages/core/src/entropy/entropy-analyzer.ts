/**
 * SED - Semantic Entropy Differencing
 * Entropy Analyzer - High-Level Analysis Interface
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  MerkleNode,
  NodeEntropy,
  EntropyAnalysis,
  EntropyHotspot,
  EntropyThresholds,
  EntropyLevel,
  EntropyDistribution,
} from '@sed/shared/types';
import { DEFAULT_ENTROPY_THRESHOLDS } from '@sed/shared/types';

import { EntropyCalculator } from './entropy-calculator.js';
import { PropagationTracker } from './propagation-tracker.js';

/**
 * Options for entropy analysis
 */
interface AnalysisOptions {
  thresholds?: EntropyThresholds;
  maxHotspots?: number;
  trackPropagation?: boolean;
  includeUnchanged?: boolean;
  hotspotThreshold?: number;
}

/**
 * Options for detectHotspots method
 */
interface HotspotOptions {
  maxHotspots?: number;
  threshold?: number;
}

/**
 * Default analysis options
 */
const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  thresholds: DEFAULT_ENTROPY_THRESHOLDS,
  maxHotspots: 10,
  trackPropagation: true,
  includeUnchanged: false,
  hotspotThreshold: 0.5,
};

/**
 * Entropy Analyzer
 *
 * Provides high-level analysis of entropy across a codebase,
 * identifying hotspots and providing actionable insights.
 */
export class EntropyAnalyzer {
  private readonly calculator: EntropyCalculator;
  private readonly propagationTracker: PropagationTracker;
  private readonly options: Required<AnalysisOptions>;

  constructor(options: AnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.calculator = new EntropyCalculator({ thresholds: this.options.thresholds });
    this.propagationTracker = new PropagationTracker();
  }

  /**
   * Analyze entropy - Overloaded method
   * 1. For MerkleNode-based analysis (original API)
   * 2. For NodeEntropy array analysis (test API)
   */
  analyze(
    oldRootsOrEntropies: MerkleNode[] | NodeEntropy[],
    newRoots?: MerkleNode[],
    changes?: {
      added: MerkleNode[];
      removed: MerkleNode[];
      modified: Array<{ old: MerkleNode; new: MerkleNode }>;
      unchanged: MerkleNode[];
    }
  ): EntropyAnalysis {
    // Check if first argument is NodeEntropy[] (test API)
    if (this.isNodeEntropyArray(oldRootsOrEntropies)) {
      return this.analyzeFromEntropies(oldRootsOrEntropies as NodeEntropy[]);
    }

    // Otherwise, use original MerkleNode-based API
    if (!newRoots || !changes) {
      throw new Error('MerkleNode-based analysis requires newRoots and changes parameters');
    }
    return this.analyzeFromChanges(oldRootsOrEntropies as MerkleNode[], newRoots, changes);
  }

  /**
   * Type guard to check if input is NodeEntropy array
   */
  private isNodeEntropyArray(input: unknown): boolean {
    if (!Array.isArray(input)) return false;
    if (input.length === 0) return true; // Empty array treated as NodeEntropy[]
    // Check first element has NodeEntropy shape
    const first = input[0];
    return (
      typeof first === 'object' &&
      first !== null &&
      'nodeId' in first &&
      'entropy' in first &&
      'normalizedEntropy' in first &&
      'level' in first
    );
  }

  /**
   * Analyze entropy from NodeEntropy array (test API)
   */
  private analyzeFromEntropies(nodeEntropies: NodeEntropy[]): EntropyAnalysis {
    const startTime = performance.now();

    if (nodeEntropies.length === 0) {
      return {
        totalEntropy: 0,
        structuralEntropy: 0,
        semanticEntropy: 0,
        propagationFactor: 1.0,
        changeScore: 0,
        entropy: 0,
        normalizedEntropy: 0,
        level: 'minimal',
        nodeEntropies: [],
        hotspots: [],
        components: {
          structural: 0,
          semantic: 0,
          syntactic: 0,
        },
        metadata: {
          algorithm: 'entropy-analyzer-v1',
          version: '1.0.0',
          computeTime: performance.now() - startTime,
          totalChanges: 0,
          addedCount: 0,
          removedCount: 0,
          modifiedCount: 0,
          analysisTime: performance.now() - startTime,
        },
      };
    }

    // Calculate total entropy
    const totalEntropy = this.calculator.calculateTotalEntropy(nodeEntropies);

    // Identify hotspots
    const hotspots = this.identifyHotspots(nodeEntropies);

    // Calculate distribution
    const distribution = this.calculateDistribution(nodeEntropies);

    // Calculate average from normalizedEntropy values
    const totalNormalizedEntropy = nodeEntropies.reduce((sum, n) => sum + n.normalizedEntropy, 0);
    const averageEntropy =
      nodeEntropies.length > 0 ? totalNormalizedEntropy / nodeEntropies.length : 0;

    // Determine overall level - use provided level if single node, otherwise calculate
    const overallLevel =
      nodeEntropies.length === 1
        ? (nodeEntropies[0]?.level ?? 'minimal')
        : this.determineOverallLevel(totalEntropy, nodeEntropies);

    const analysisTime = performance.now() - startTime;

    // Count by change type
    const addedCount = nodeEntropies.filter((n) => n.changeType === 'added').length;
    const removedCount = nodeEntropies.filter((n) => n.changeType === 'removed').length;
    const modifiedCount = nodeEntropies.filter((n) => n.changeType === 'modified').length;

    return {
      totalEntropy,
      structuralEntropy: totalEntropy * 0.4, // Approximate structural component
      semanticEntropy: totalEntropy * 0.6, // Approximate semantic component
      propagationFactor: 1.0,
      changeScore: totalEntropy,
      entropy: totalEntropy,
      normalizedEntropy: averageEntropy,
      level: overallLevel,
      nodeEntropies,
      hotspots,
      components: {
        structural: totalEntropy * 0.4,
        semantic: totalEntropy * 0.6,
        syntactic: 0,
      },
      metadata: {
        algorithm: 'entropy-analyzer-v1',
        version: '1.0.0',
        computeTime: analysisTime,
        totalChanges: nodeEntropies.length,
        addedCount,
        removedCount,
        modifiedCount,
        analysisTime,
      },
    };
  }

  /**
   * Analyze entropy from MerkleNode changes (original API)
   */
  private analyzeFromChanges(
    oldRoots: MerkleNode[],
    newRoots: MerkleNode[],
    changes: {
      added: MerkleNode[];
      removed: MerkleNode[];
      modified: Array<{ old: MerkleNode; new: MerkleNode }>;
      unchanged: MerkleNode[];
    }
  ): EntropyAnalysis {
    const startTime = performance.now();

    // Calculate entropy for each change
    const nodeEntropies: NodeEntropy[] = [];

    // Added nodes
    for (const node of changes.added) {
      nodeEntropies.push(this.calculator.calculateNodeEntropy(null, node));
    }

    // Removed nodes
    for (const node of changes.removed) {
      nodeEntropies.push(this.calculator.calculateNodeEntropy(node, null));
    }

    // Modified nodes
    for (const { old, new: newNode } of changes.modified) {
      nodeEntropies.push(this.calculator.calculateNodeEntropy(old, newNode));
    }

    // Optionally include unchanged nodes
    if (this.options.includeUnchanged) {
      for (const node of changes.unchanged) {
        nodeEntropies.push(this.calculator.calculateNodeEntropy(node, node));
      }
    }

    // Track propagation effects
    if (this.options.trackPropagation) {
      this.propagationTracker.trackPropagation(newRoots, nodeEntropies);
    }

    // Calculate total entropy
    const totalEntropy = this.calculator.calculateTotalEntropy(nodeEntropies);

    // Identify hotspots
    const hotspots = this.identifyHotspots(nodeEntropies);

    // Calculate distribution across levels
    const distribution = this.calculateDistribution(nodeEntropies);

    // Determine overall level
    const overallLevel = this.determineOverallLevel(totalEntropy, nodeEntropies);

    const analysisTime = performance.now() - startTime;

    return {
      totalEntropy,
      structuralEntropy: totalEntropy * 0.4,
      semanticEntropy: totalEntropy * 0.6,
      propagationFactor: 1.0,
      changeScore: totalEntropy,
      entropy: totalEntropy,
      normalizedEntropy: totalEntropy / Math.max(1, nodeEntropies.length),
      level: overallLevel,
      nodeEntropies,
      hotspots,
      components: {
        structural: totalEntropy * 0.4,
        semantic: totalEntropy * 0.6,
        syntactic: 0,
      },
      metadata: {
        algorithm: 'entropy-analyzer-v1',
        version: '1.0.0',
        computeTime: analysisTime,
        totalChanges: nodeEntropies.length,
        addedCount: changes.added.length,
        removedCount: changes.removed.length,
        modifiedCount: changes.modified.length,
        analysisTime,
      },
    };
  }

  /**
   * Quick entropy check for a single change
   */
  quickAnalyze(oldNode: MerkleNode | null, newNode: MerkleNode | null): NodeEntropy {
    return this.calculator.calculateNodeEntropy(oldNode, newNode);
  }

  /**
   * Detect entropy hotspots from NodeEntropy array
   */
  detectHotspots(nodeEntropies: NodeEntropy[], options?: HotspotOptions): EntropyHotspot[] {
    const maxHotspots = options?.maxHotspots ?? this.options.maxHotspots;
    const threshold = options?.threshold ?? this.options.hotspotThreshold;

    // Filter by threshold
    const filtered = nodeEntropies.filter((n) => n.normalizedEntropy >= threshold);

    // Sort by entropy (descending)
    const sorted = [...filtered].sort((a, b) => b.entropy - a.entropy);

    // Take top N
    const topN = sorted.slice(0, maxHotspots);

    // Convert to hotspots
    return topN.map((node, index) => ({
      nodeId: node.nodeId,
      entropy: node.entropy,
      reason: this.getHotspotRecommendation(node),
      suggestedReview: node.entropy > 0.7 || node.level === 'high' || node.level === 'critical',
      affectedNodes: [], // Will be populated by propagation tracker if enabled
      // Legacy properties for backward compatibility
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      normalizedEntropy: node.normalizedEntropy,
      level: node.level,
    }));
  }

  /**
   * Calculate distribution of entropy levels (public method)
   */
  calculateDistribution(nodeEntropies: NodeEntropy[]): Record<EntropyLevel, number> {
    const distribution: Record<EntropyLevel, number> = {
      none: 0,
      minimal: 0,
      low: 0,
      medium: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    for (const node of nodeEntropies) {
      distribution[node.level]++;
    }

    return distribution;
  }

  /**
   * Compare entropy between two analyses (legacy method name)
   */
  compare(
    analysis1: EntropyAnalysis,
    analysis2: EntropyAnalysis
  ): {
    entropyDelta: number;
    levelChange: { from: EntropyLevel; to: EntropyLevel };
    newHotspots: EntropyHotspot[];
    resolvedHotspots: EntropyHotspot[];
  } {
    return this.compareAnalyses(analysis1, analysis2);
  }

  /**
   * Compare entropy between two analyses (test API)
   */
  compareAnalyses(
    analysis1: EntropyAnalysis,
    analysis2: EntropyAnalysis
  ): {
    entropyDelta: number;
    levelChange: { from: EntropyLevel; to: EntropyLevel };
    newHotspots: EntropyHotspot[];
    resolvedHotspots: EntropyHotspot[];
    improved: boolean;
    regressed: boolean;
  } {
    const entropyDelta = analysis2.totalEntropy - analysis1.totalEntropy;

    const hotspot1Names = new Set(analysis1.hotspots.map((h: EntropyHotspot) => h.nodeName));
    const hotspot2Names = new Set(analysis2.hotspots.map((h: EntropyHotspot) => h.nodeName));

    const newHotspots = analysis2.hotspots.filter(
      (h: EntropyHotspot) => !hotspot1Names.has(h.nodeName)
    );
    const resolvedHotspots = analysis1.hotspots.filter(
      (h: EntropyHotspot) => !hotspot2Names.has(h.nodeName)
    );

    // Define entropy level ordering for comparison
    const levelOrder: Record<EntropyLevel, number> = {
      none: 0,
      minimal: 1,
      low: 2,
      medium: 3,
      moderate: 4,
      high: 5,
      critical: 6,
    };

    const level1Order = levelOrder[analysis1.level] ?? 0;
    const level2Order = levelOrder[analysis2.level] ?? 0;

    // Improved if entropy decreased or level decreased
    const improved = entropyDelta < 0 || level2Order < level1Order;

    // Regressed if entropy increased significantly or level increased
    const regressed = entropyDelta > 0 || level2Order > level1Order;

    return {
      entropyDelta,
      levelChange: {
        from: analysis1.level,
        to: analysis2.level,
      },
      newHotspots,
      resolvedHotspots,
      improved,
      regressed,
    };
  }

  /**
   * Get recommendations based on entropy analysis
   */
  getRecommendations(analysis: EntropyAnalysis): string[] {
    const recommendations: string[] = [];

    // Check overall entropy level
    if (analysis.level === 'critical') {
      recommendations.push(
        '⚠️ CRITICAL: This change has very high entropy. Consider breaking it into smaller changes.'
      );
    } else if (analysis.level === 'high') {
      recommendations.push(
        '⚡ HIGH ENTROPY: This change is significant. Ensure thorough code review.'
      );
    }

    // Check hotspots
    if (analysis.hotspots.length > 5) {
      recommendations.push(
        `🎯 ${analysis.hotspots.length} entropy hotspots detected. Focus review on these areas.`
      );
    }

    // Check for concentrated changes
    const topHotspot = analysis.hotspots[0];
    if (topHotspot && (topHotspot.normalizedEntropy ?? 0) > 0.8) {
      recommendations.push(
        `🔥 High concentration in "${topHotspot.nodeName ?? 'unknown'}" (${topHotspot.nodeType ?? 'unknown'}). Consider refactoring.`
      );
    }

    // Check change type distribution
    const { addedCount, removedCount, modifiedCount } = analysis.metadata;
    const totalChanges = (addedCount ?? 0) + (removedCount ?? 0) + (modifiedCount ?? 0);

    if ((addedCount ?? 0) > totalChanges * 0.7) {
      recommendations.push('➕ Mostly additions. Ensure new code follows existing patterns.');
    }

    if ((removedCount ?? 0) > totalChanges * 0.5) {
      recommendations.push('➖ Significant removals. Verify no unintended functionality is lost.');
    }

    // Check propagation - identify high-entropy nodes that may have wide impact
    const highPropagation = analysis.nodeEntropies.filter(
      (n: NodeEntropy) => n.level === 'high' || n.level === 'critical'
    );
    if (highPropagation.length > 0) {
      recommendations.push(
        `🌊 ${highPropagation.length} changes have high propagation potential. Test dependent code.`
      );
    }

    return recommendations;
  }

  // Private methods

  /**
   * Identify entropy hotspots
   */
  private identifyHotspots(nodeEntropies: NodeEntropy[]): EntropyHotspot[] {
    // Filter out minimal changes
    const significant = nodeEntropies.filter((n) => n.level !== 'minimal');

    // Sort by entropy (descending)
    const sorted = [...significant].sort((a, b) => b.entropy - a.entropy);

    // Take top N
    const topN = sorted.slice(0, this.options.maxHotspots);

    // Convert to hotspots
    return topN.map((node, index) => ({
      nodeId: node.nodeId,
      entropy: node.entropy,
      reason: this.getHotspotRecommendation(node),
      suggestedReview: node.entropy > 0.7 || node.level === 'high' || node.level === 'critical',
      affectedNodes: [], // Will be populated by propagation tracker if enabled
      // Legacy properties for backward compatibility
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      normalizedEntropy: node.normalizedEntropy,
      level: node.level,
    }));
  }

  /**
   * Get recommendation for a specific hotspot
   */
  private getHotspotRecommendation(node: NodeEntropy): string {
    if (node.level === 'critical') {
      return `Critical change in ${node.nodeType} "${node.nodeName}". Requires careful review.`;
    }

    if (node.level === 'high') {
      return `High entropy in ${node.nodeType}. Consider additional testing.`;
    }

    if (node.changeType === 'removed') {
      return `Removal of ${node.nodeType}. Ensure all dependencies are updated.`;
    }

    if (node.changeType === 'added') {
      return `New ${node.nodeType}. Verify it follows project conventions.`;
    }

    return `Modified ${node.nodeType}. Standard review recommended.`;
  }

  /**
   * Determine overall entropy level
   */
  private determineOverallLevel(totalEntropy: number, nodeEntropies: NodeEntropy[]): EntropyLevel {
    // If any node is critical, overall is critical
    if (nodeEntropies.some((n: NodeEntropy) => n.level === 'critical')) {
      return 'critical';
    }

    // If multiple high entropy nodes, escalate
    const highCount = nodeEntropies.filter((n: NodeEntropy) => n.level === 'high').length;
    if (highCount >= 3) {
      return 'critical';
    }
    if (highCount >= 1) {
      return 'high';
    }

    // Check moderate
    const moderateCount = nodeEntropies.filter((n: NodeEntropy) => n.level === 'moderate').length;
    if (moderateCount >= 5) {
      return 'high';
    }
    if (moderateCount >= 2) {
      return 'moderate';
    }

    // Check low
    const lowCount = nodeEntropies.filter((n: NodeEntropy) => n.level === 'low').length;
    if (lowCount >= 3) {
      return 'low';
    }

    return 'minimal';
  }
}
