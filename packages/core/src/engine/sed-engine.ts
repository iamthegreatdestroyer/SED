/**
 * SED - Semantic Entropy Differencing
 * SED Engine - Core Orchestration Layer
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SemanticNode,
  MerkleNode,
  SEDResult,
  EntropyAnalysis,
  SemanticDiff,
  EntropyThresholds,
  SupportedLanguage,
} from '@sed/shared/types';
import { DEFAULT_ENTROPY_THRESHOLDS } from '@sed/shared/types';

import { SemanticParser } from '../semantic/parser.js';
import { MerkleTreeBuilder } from '../semantic/merkle-tree.js';
import { EntropyCalculator } from '../entropy/entropy-calculator.js';
import { EntropyAnalyzer } from '../entropy/entropy-analyzer.js';
import { DiffProcessor } from './diff-processor.js';
import { ChangeClassifier } from './change-classifier.js';

/**
 * Configuration for SED Engine
 */
interface SEDEngineConfig {
  thresholds?: EntropyThresholds;
  parseTimeout?: number;
  maxHotspots?: number;
  includeContent?: boolean;
  trackPropagation?: boolean;
}

/**
 * Default engine configuration
 */
const DEFAULT_CONFIG: Required<SEDEngineConfig> = {
  thresholds: DEFAULT_ENTROPY_THRESHOLDS,
  parseTimeout: 30000,
  maxHotspots: 10,
  includeContent: false,
  trackPropagation: true,
};

/**
 * Input for comparing two code versions
 */
interface CompareInput {
  oldCode: string;
  newCode: string;
  language: SupportedLanguage;
  filePath?: string;
}

/**
 * Input for batch comparison
 */
interface BatchCompareInput {
  files: Array<{
    filePath: string;
    oldCode: string;
    newCode: string;
    language: SupportedLanguage;
  }>;
}

/**
 * SED Engine
 *
 * The main orchestration layer that combines semantic parsing,
 * Merkle tree generation, entropy calculation, and change classification
 * into a unified API.
 *
 * Usage:
 * ```typescript
 * const engine = new SEDEngine();
 * const result = await engine.compare({
 *   oldCode: 'function foo() {}',
 *   newCode: 'function foo() { return 1; }',
 *   language: 'typescript',
 * });
 * console.log(result.analysis.level); // 'low'
 * ```
 */
export class SEDEngine {
  private readonly config: Required<SEDEngineConfig>;
  private readonly parser: SemanticParser;
  private readonly merkleBuilder: MerkleTreeBuilder;
  private readonly entropyCalculator: EntropyCalculator;
  private readonly entropyAnalyzer: EntropyAnalyzer;
  private readonly diffProcessor: DiffProcessor;
  private readonly changeClassifier: ChangeClassifier;

  constructor(config: SEDEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize components
    this.parser = new SemanticParser();
    this.merkleBuilder = new MerkleTreeBuilder();
    this.entropyCalculator = new EntropyCalculator({
      thresholds: this.config.thresholds,
    });
    this.entropyAnalyzer = new EntropyAnalyzer({
      thresholds: this.config.thresholds,
      maxHotspots: this.config.maxHotspots,
      trackPropagation: this.config.trackPropagation,
    });
    this.diffProcessor = new DiffProcessor({
      includeContent: this.config.includeContent,
    });
    this.changeClassifier = new ChangeClassifier({
      thresholds: this.config.thresholds,
    });
  }

  /**
   * Compare two versions of code and compute semantic entropy diff
   */
  async compare(input: CompareInput): Promise<SEDResult> {
    const startTime = performance.now();

    // Parse both versions
    const [oldNodes, newNodes] = await Promise.all([
      this.parser.parse(input.oldCode, input.language, {
        timeout: this.config.parseTimeout,
      }),
      this.parser.parse(input.newCode, input.language, {
        timeout: this.config.parseTimeout,
      }),
    ]);

    // Build Merkle trees
    const oldTrees = oldNodes.map((n) => this.merkleBuilder.build(n));
    const newTrees = newNodes.map((n) => this.merkleBuilder.build(n));

    // Compute diff
    const diff = this.computeDiff(oldTrees, newTrees);

    // Categorize changes
    const changes = this.categorizeChanges(oldTrees, newTrees, diff);

    // Analyze entropy
    const analysis = this.entropyAnalyzer.analyze(oldTrees, newTrees, changes);

    // Classify changes
    const entropyMap = new Map(analysis.nodeEntropies.map((e) => [e.nodeId, e]));
    const classifications = this.changeClassifier.classifyBatch(diff.changes, entropyMap);

    // Generate summary
    const classificationSummary = this.changeClassifier.generateSummary(classifications);

    const processingTime = performance.now() - startTime;

    return {
      diff,
      analysis,
      classifications,
      summary: {
        ...classificationSummary,
        processingTime,
      },
      metadata: {
        oldFile: input.filePath ?? 'unknown',
        newFile: input.filePath ?? 'unknown',
        language: input.language,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Batch compare multiple files
   */
  async compareBatch(input: BatchCompareInput): Promise<SEDResult[]> {
    const results: SEDResult[] = [];

    // Process files sequentially to avoid memory pressure
    for (const file of input.files) {
      const result = await this.compare({
        oldCode: file.oldCode,
        newCode: file.newCode,
        language: file.language,
        filePath: file.filePath,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Analyze a single code file (no diff, just structure)
   */
  async analyze(
    code: string,
    language: SupportedLanguage,
    filePath?: string
  ): Promise<{
    nodes: SemanticNode[];
    trees: MerkleNode[];
    complexity: number;
  }> {
    const nodes = await this.parser.parse(code, language, {
      timeout: this.config.parseTimeout,
    });

    const trees = nodes.map((n) => this.merkleBuilder.build(n));

    const complexity = this.calculateComplexity(trees);

    return {
      nodes,
      trees,
      complexity,
    };
  }

  /**
   * Quick entropy check for a code change
   */
  async quickEntropy(
    oldCode: string,
    newCode: string,
    language: SupportedLanguage
  ): Promise<{
    level: string;
    score: number;
    recommendation: string;
  }> {
    const result = await this.compare({
      oldCode,
      newCode,
      language,
    });

    let recommendation: string;
    switch (result.analysis.level) {
      case 'critical':
        recommendation = 'Split into smaller changes. Mandatory review.';
        break;
      case 'high':
        recommendation = 'Consider splitting. Detailed review recommended.';
        break;
      case 'moderate':
        recommendation = 'Standard review process.';
        break;
      case 'low':
        recommendation = 'Quick review should suffice.';
        break;
      default:
        recommendation = 'Auto-merge candidate.';
    }

    return {
      level: result.analysis.level,
      score: result.analysis.normalizedEntropy,
      recommendation,
    };
  }

  /**
   * Get detailed metrics for a comparison
   */
  getMetrics(result: SEDResult): {
    entropy: number;
    complexity: number;
    hotspotCount: number;
    changeCount: number;
    riskScore: number;
    level: string;
    reviewRequired: boolean;
  } {
    const reviewRequired = result.classifications.some((c) => c.reviewRequired);

    return {
      entropy: result.analysis.totalEntropy,
      complexity: this.calculateComplexityFromDiff(result.diff),
      hotspotCount: result.analysis.hotspots.length,
      changeCount: result.diff.summary.totalChanges,
      riskScore: result.summary.averageRiskScore,
      level: result.analysis.level,
      reviewRequired,
    };
  }

  /**
   * Validate parser is working for a language
   */
  async validateParser(language: SupportedLanguage): Promise<boolean> {
    return this.parser.validate(language);
  }

  // Private methods

  /**
   * Compute semantic diff between Merkle trees
   */
  private computeDiff(oldTrees: MerkleNode[], newTrees: MerkleNode[]): SemanticDiff {
    // Convert back to semantic nodes for diff processor
    const oldNodes = this.extractSemanticNodes(oldTrees);
    const newNodes = this.extractSemanticNodes(newTrees);

    return this.diffProcessor.diff(oldNodes, newNodes);
  }

  /**
   * Extract semantic nodes from Merkle trees
   */
  private extractSemanticNodes(trees: MerkleNode[]): SemanticNode[] {
    return trees.map((tree) => this.merkleToSemantic(tree));
  }

  /**
   * Convert Merkle node back to semantic node
   */
  private merkleToSemantic(merkle: MerkleNode): SemanticNode {
    return {
      id: merkle.id,
      type: merkle.type,
      name: merkle.name,
      range: { start: 0, end: 0 }, // Range lost in Merkle conversion
      children: merkle.children.map((c) => this.merkleToSemantic(c)),
    };
  }

  /**
   * Categorize changes for entropy analysis
   */
  private categorizeChanges(
    oldTrees: MerkleNode[],
    newTrees: MerkleNode[],
    diff: SemanticDiff
  ): {
    added: MerkleNode[];
    removed: MerkleNode[];
    modified: Array<{ old: MerkleNode; new: MerkleNode }>;
    unchanged: MerkleNode[];
  } {
    const oldIndex = new Map<string, MerkleNode>();
    const newIndex = new Map<string, MerkleNode>();

    // Index trees
    for (const tree of oldTrees) {
      this.indexTree(tree, oldIndex);
    }
    for (const tree of newTrees) {
      this.indexTree(tree, newIndex);
    }

    const added: MerkleNode[] = [];
    const removed: MerkleNode[] = [];
    const modified: Array<{ old: MerkleNode; new: MerkleNode }> = [];
    const unchanged: MerkleNode[] = [];

    // Categorize each change
    for (const change of diff.changes) {
      const key = `${change.nodeType}::${change.nodeName}`;
      const oldNode = oldIndex.get(key);
      const newNode = newIndex.get(key);

      switch (change.changeType) {
        case 'added':
          if (newNode) added.push(newNode);
          break;
        case 'removed':
          if (oldNode) removed.push(oldNode);
          break;
        case 'modified':
          if (oldNode && newNode) {
            modified.push({ old: oldNode, new: newNode });
          }
          break;
      }
    }

    // Find unchanged nodes
    for (const [key, newNode] of newIndex) {
      const oldNode = oldIndex.get(key);
      if (oldNode && oldNode.merkleHash === newNode.merkleHash) {
        unchanged.push(newNode);
      }
    }

    return { added, removed, modified, unchanged };
  }

  /**
   * Index a Merkle tree by qualified name
   */
  private indexTree(node: MerkleNode, index: Map<string, MerkleNode>): void {
    const key = `${node.type}::${node.name}`;
    index.set(key, node);

    for (const child of node.children) {
      this.indexTree(child, index);
    }
  }

  /**
   * Calculate overall complexity from trees
   */
  private calculateComplexity(trees: MerkleNode[]): number {
    let complexity = 0;

    const calculateNodeComplexity = (node: MerkleNode, depth: number): number => {
      let nodeComplexity = 1 + depth * 0.1;

      for (const child of node.children) {
        nodeComplexity += calculateNodeComplexity(child, depth + 1);
      }

      return nodeComplexity;
    };

    for (const tree of trees) {
      complexity += calculateNodeComplexity(tree, 0);
    }

    return complexity;
  }

  /**
   * Calculate complexity from diff
   */
  private calculateComplexityFromDiff(diff: SemanticDiff): number {
    // Simple heuristic based on change count and types
    const { added, removed, modified } = diff.summary;

    return (
      added * 1.5 + // Additions are more complex
      removed * 1.0 + // Removals less so
      modified * 1.2 // Modifications in between
    );
  }
}
