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
}

/**
 * Default analysis options
 */
const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  thresholds: DEFAULT_ENTROPY_THRESHOLDS,
  maxHotspots: 10,
  trackPropagation: true,
  includeUnchanged: false,
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
   * Analyze entropy for a set of changes
   */
  analyze(
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
      normalizedEntropy: totalEntropy / Math.max(1, nodeEntropies.length),
      level: overallLevel,
      nodeEntropies,
      hotspots,
      distribution,
      metadata: {
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
   * Compare entropy between two analyses
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
    const entropyDelta = analysis2.totalEntropy - analysis1.totalEntropy;

    const hotspot1Names = new Set(analysis1.hotspots.map((h) => h.nodeName));
    const hotspot2Names = new Set(analysis2.hotspots.map((h) => h.nodeName));

    const newHotspots = analysis2.hotspots.filter((h) => !hotspot1Names.has(h.nodeName));
    const resolvedHotspots = analysis1.hotspots.filter((h) => !hotspot2Names.has(h.nodeName));

    return {
      entropyDelta,
      levelChange: {
        from: analysis1.level,
        to: analysis2.level,
      },
      newHotspots,
      resolvedHotspots,
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
    if (topHotspot && topHotspot.normalizedEntropy > 0.8) {
      recommendations.push(
        `🔥 High concentration in "${topHotspot.nodeName}" (${topHotspot.nodeType}). Consider refactoring.`
      );
    }

    // Check change type distribution
    const { addedCount, removedCount, modifiedCount } = analysis.metadata;
    const totalChanges = addedCount + removedCount + modifiedCount;

    if (addedCount > totalChanges * 0.7) {
      recommendations.push('➕ Mostly additions. Ensure new code follows existing patterns.');
    }

    if (removedCount > totalChanges * 0.5) {
      recommendations.push('➖ Significant removals. Verify no unintended functionality is lost.');
    }

    // Check propagation
    const highPropagation = analysis.nodeEntropies.filter(
      (n) => n.components?.propagation && n.components.propagation > 2
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
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      entropy: node.entropy,
      normalizedEntropy: node.normalizedEntropy,
      level: node.level,
      rank: index + 1,
      recommendation: this.getHotspotRecommendation(node),
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
   * Calculate distribution across entropy levels
   */
  private calculateDistribution(nodeEntropies: NodeEntropy[]): Record<EntropyLevel, number> {
    const distribution: Record<EntropyLevel, number> = {
      minimal: 0,
      low: 0,
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
   * Determine overall entropy level
   */
  private determineOverallLevel(totalEntropy: number, nodeEntropies: NodeEntropy[]): EntropyLevel {
    // If any node is critical, overall is critical
    if (nodeEntropies.some((n) => n.level === 'critical')) {
      return 'critical';
    }

    // If multiple high entropy nodes, escalate
    const highCount = nodeEntropies.filter((n) => n.level === 'high').length;
    if (highCount >= 3) {
      return 'critical';
    }
    if (highCount >= 1) {
      return 'high';
    }

    // Check moderate
    const moderateCount = nodeEntropies.filter((n) => n.level === 'moderate').length;
    if (moderateCount >= 5) {
      return 'high';
    }
    if (moderateCount >= 2) {
      return 'moderate';
    }

    // Check low
    const lowCount = nodeEntropies.filter((n) => n.level === 'low').length;
    if (lowCount >= 3) {
      return 'low';
    }

    return 'minimal';
  }
}
