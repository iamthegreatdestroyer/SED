/**
 * SED - Semantic Entropy Differencing
 * Semantic Differ - Main Orchestrator
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SupportedLanguage,
  SemanticNode,
  MerkleNode,
  NodeEntropy,
  DiffChange,
  DiffStats,
  SEDDiffResult,
  DiffOptions,
  EntropyLevel,
  EntropyAnalysis,
} from '@sed/shared/types';
import { DEFAULT_DIFF_OPTIONS } from '@sed/shared/types';
import { generateId } from '@sed/shared/utils';
import { createSourcePosition } from '../utils/helpers.js';

import { SemanticParser } from './parser.js';
import { MerkleTreeBuilder } from './merkle-tree.js';
import { EntropyCalculator } from '../entropy/entropy-calculator.js';

/**
 * Result of comparing two Merkle trees
 */
interface MerkleComparison {
  readonly addedNodes: MerkleNode[];
  readonly removedNodes: MerkleNode[];
  readonly modifiedNodes: Array<{ old: MerkleNode; new: MerkleNode }>;
  readonly unchangedNodes: MerkleNode[];
}

/**
 * Semantic Differ - Main orchestrator for semantic code differencing
 *
 * Workflow:
 * 1. Parse old and new code into semantic AST
 * 2. Build Merkle trees for efficient change detection
 * 3. Compare Merkle trees to find changed subtrees
 * 4. Calculate entropy for changed nodes
 * 5. Produce comprehensive diff result
 */
export class SemanticDiffer {
  private readonly parser: SemanticParser;
  private readonly merkleBuilder: MerkleTreeBuilder;
  private readonly entropyCalculator: EntropyCalculator;
  private readonly options: Required<DiffOptions>;

  constructor(options: DiffOptions = {}) {
    this.options = { ...DEFAULT_DIFF_OPTIONS, ...options };
    this.parser = new SemanticParser();
    this.merkleBuilder = new MerkleTreeBuilder({
      maxDepth: this.options.maxDepth,
    });
    this.entropyCalculator = new EntropyCalculator({
      useSemanticWeights: true,
    });
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(filePath: string): SupportedLanguage {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, SupportedLanguage> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'cpp',
      cs: 'csharp',
    };
    return languageMap[ext] || 'typescript';
  }

  /**
   * Compare two source code strings and produce a semantic diff
   *
   * @param oldSource - Original source code
   * @param newSource - Modified source code
   * @param filePath - File path for language detection
   * @param language - Optional explicit language
   * @returns Complete semantic diff result
   */
  async diff(
    oldSource: string,
    newSource: string,
    filePath: string,
    language?: SupportedLanguage
  ): Promise<SEDDiffResult> {
    const startTime = performance.now();

    // Determine language from filePath if not provided
    const detectedLanguage = language || this.detectLanguage(filePath);

    // Step 1: Parse both versions
    const [oldParseResult, newParseResult] = await Promise.all([
      this.parser.parse(oldSource, detectedLanguage, {
        filePath,
        includeComments: this.options.includeComments,
        maxDepth: this.options.maxDepth,
      }),
      this.parser.parse(newSource, detectedLanguage, {
        filePath,
        includeComments: this.options.includeComments,
        maxDepth: this.options.maxDepth,
      }),
    ]);

    // Step 2: Build Merkle trees
    const oldMerkleResult = this.merkleBuilder.build(oldParseResult.nodes);
    const newMerkleResult = this.merkleBuilder.build(newParseResult.nodes);

    // Step 3: Compare Merkle trees to find changes
    const comparison = this.compareMerkleTrees(oldMerkleResult.roots, newMerkleResult.roots);

    // Step 4: Calculate entropy for changes
    const changes = await this.computeChanges(comparison, oldParseResult.language);

    // Step 5: Compute statistics
    const stats = this.computeStats(changes);

    // Step 6: Assemble result
    const computeTime = performance.now() - startTime;

    return {
      files: [
        {
          path: filePath,
          language: oldParseResult.language,
          changes,
          groups: [], // TODO: Implement grouping in future
          totalEntropy: this.computeTotalEntropy(changes),
          stats,
        },
      ],
      summary: {
        totalFiles: 1,
        totalChanges: changes.length,
        overallEntropy: this.computeTotalEntropy(changes),
        hotspots: this.identifyHotspots(changes),
        stats,
        riskLevel: this.determineRiskLevel(stats.entropyScore),
      },
      metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        computeTime,
        algorithm: 'sed-v1',
      },
    };
  }

  /**
   * Compare two Merkle trees and identify changes
   */
  private compareMerkleTrees(oldRoots: MerkleNode[], newRoots: MerkleNode[]): MerkleComparison {
    const addedNodes: MerkleNode[] = [];
    const removedNodes: MerkleNode[] = [];
    const modifiedNodes: Array<{ old: MerkleNode; new: MerkleNode }> = [];
    const unchangedNodes: MerkleNode[] = [];

    // Build maps for efficient lookup using semantic node ID
    const oldMap = new Map<string, MerkleNode>();
    const newMap = new Map<string, MerkleNode>();

    const collectNodes = (nodes: MerkleNode[], map: Map<string, MerkleNode>) => {
      const traverse = (node: MerkleNode) => {
        map.set(node.id, node);
        node.children.forEach(traverse);
      };
      nodes.forEach(traverse);
    };

    collectNodes(oldRoots, oldMap);
    collectNodes(newRoots, newMap);

    // Identify added, removed, and modified nodes
    for (const [id, newNode] of newMap) {
      const oldNode = oldMap.get(id);
      if (!oldNode) {
        addedNodes.push(newNode);
      } else if (oldNode.merkleHash !== newNode.merkleHash) {
        modifiedNodes.push({ old: oldNode, new: newNode });
      } else {
        unchangedNodes.push(newNode);
      }
    }

    for (const [id, oldNode] of oldMap) {
      if (!newMap.has(id)) {
        removedNodes.push(oldNode);
      }
    }

    return { addedNodes, removedNodes, modifiedNodes, unchangedNodes };
  }

  /**
   * Compute DiffChange objects from Merkle comparison
   */
  private async computeChanges(
    comparison: MerkleComparison,
    language: SupportedLanguage
  ): Promise<DiffChange[]> {
    const changes: DiffChange[] = [];

    // Process additions
    for (const node of comparison.addedNodes) {
      const entropyResult = this.entropyCalculator.calculateNodeEntropy(null, node);
      changes.push({
        id: generateId(`add:${node.id}`),
        operation: 'add',
        path: this.getNodePath(node),
        range: {
          start: createSourcePosition(node.startLine, 0, 0),
          end: createSourcePosition(node.endLine, 0, 0),
        },
        afterNode: node as unknown as SemanticNode,
        entropy: this.convertToEntropyAnalysis(entropyResult),
        description: `Added ${node.type} '${node.name}'`,
      });
    }

    // Process removals
    for (const node of comparison.removedNodes) {
      const entropyResult = this.entropyCalculator.calculateNodeEntropy(node, null);
      changes.push({
        id: generateId(`remove:${node.id}`),
        operation: 'remove',
        path: this.getNodePath(node),
        range: {
          start: createSourcePosition(node.startLine, 0, 0),
          end: createSourcePosition(node.endLine, 0, 0),
        },
        beforeNode: node as unknown as SemanticNode,
        entropy: this.convertToEntropyAnalysis(entropyResult),
        description: `Removed ${node.type} '${node.name}'`,
      });
    }

    // Process modifications
    for (const { old: oldNode, new: newNode } of comparison.modifiedNodes) {
      const entropyResult = this.entropyCalculator.calculateNodeEntropy(oldNode, newNode);

      // Filter by entropy threshold
      if (entropyResult.entropy >= this.options.entropyThreshold) {
        changes.push({
          id: generateId(`modify:${oldNode.id}`),
          operation: 'modify',
          path: this.getNodePath(newNode),
          range: {
            start: createSourcePosition(newNode.startLine, 0, 0),
            end: createSourcePosition(newNode.endLine, 0, 0),
          },
          beforeNode: oldNode as unknown as SemanticNode,
          afterNode: newNode as unknown as SemanticNode,
          entropy: this.convertToEntropyAnalysis(entropyResult),
          description: `Modified ${newNode.type} '${newNode.name}'`,
        });
      }
    }

    return changes;
  }

  /**
   * Get the path to a node (e.g., "MyClass.myMethod")
   */
  private getNodePath(node: MerkleNode): string {
    const parts: string[] = [];
    let current: MerkleNode | undefined = node;

    while (current) {
      if (current.name) {
        parts.unshift(current.name);
      }
      // In a real implementation, we'd track parent relationships
      // For now, just use the node name
      break;
    }

    return parts.join('.') || node.name;
  }

  /**
   * Convert NodeEntropy to EntropyAnalysis
   */
  private convertToEntropyAnalysis(nodeEntropy: NodeEntropy): EntropyAnalysis {
    return {
      totalEntropy: nodeEntropy.entropy,
      structuralEntropy: nodeEntropy.components.structural,
      semanticEntropy: nodeEntropy.components.semantic,
      propagationFactor: 1.0,
      changeScore: nodeEntropy.entropy,
      entropy: nodeEntropy.entropy,
      normalizedEntropy: nodeEntropy.normalizedEntropy,
      level: nodeEntropy.level,
      nodeEntropies: [],
      hotspots: [],
      components: {
        structural: nodeEntropy.components.structural,
        semantic: nodeEntropy.components.semantic,
        syntactic: nodeEntropy.components.syntactic ?? 0,
      },
      metadata: {
        algorithm: 'semantic-differ-v1',
        version: '1.0.0',
        computeTime: 0,
        changeType: nodeEntropy.changeType,
      },
    };
  }

  /**
   * Compute statistics from changes
   */
  private computeStats(changes: DiffChange[]): DiffStats {
    const stats = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      moves: 0,
      renames: 0,
      totalChanges: changes.length,
      entropyScore: 0,
      entropyLevel: 'low' as EntropyLevel,
    };

    let totalEntropy = 0;

    for (const change of changes) {
      switch (change.operation) {
        case 'add':
          stats.additions++;
          break;
        case 'remove':
          stats.deletions++;
          break;
        case 'modify':
          stats.modifications++;
          break;
        case 'move':
          stats.moves++;
          break;
        case 'rename':
          stats.renames++;
          break;
      }

      totalEntropy += change.entropy.entropy;
    }

    stats.entropyScore = changes.length > 0 ? totalEntropy / changes.length : 0;
    stats.entropyLevel = this.determineRiskLevel(stats.entropyScore);

    return stats;
  }

  /**
   * Compute total entropy for all changes
   */
  private computeTotalEntropy(changes: DiffChange[]): EntropyAnalysis {
    if (changes.length === 0) {
      return {
        totalEntropy: 0,
        structuralEntropy: 0,
        semanticEntropy: 0,
        propagationFactor: 1.0,
        changeScore: 0,
        entropy: 0,
        normalizedEntropy: 0,
        level: 'none',
        nodeEntropies: [],
        hotspots: [],
        components: {
          structural: 0,
          semantic: 0,
          syntactic: 0,
        },
        metadata: {
          algorithm: 'semantic-differ-v1',
          version: '1.0.0',
          computeTime: 0,
        },
      };
    }

    let totalEntropy = 0;
    let totalStructural = 0;
    let totalSemantic = 0;
    let totalSyntactic = 0;

    for (const change of changes) {
      totalEntropy += change.entropy.entropy;
      totalStructural += change.entropy.components.structural;
      totalSemantic += change.entropy.components.semantic;
      totalSyntactic += change.entropy.components.syntactic ?? 0;
    }

    const avgEntropy = totalEntropy / changes.length;

    return {
      totalEntropy,
      structuralEntropy: totalStructural,
      semanticEntropy: totalSemantic,
      propagationFactor: 1.0,
      changeScore: totalEntropy,
      entropy: totalEntropy,
      normalizedEntropy: avgEntropy,
      level: this.determineRiskLevel(avgEntropy),
      nodeEntropies: [],
      hotspots: [],
      components: {
        structural: totalStructural / changes.length,
        semantic: totalSemantic / changes.length,
        syntactic: totalSyntactic / changes.length,
      },
      metadata: {
        algorithm: 'semantic-differ-v1',
        version: '1.0.0',
        computeTime: 0,
      },
    };
  }

  /**
   * Identify hotspots (high-entropy changes)
   */
  private identifyHotspots(changes: DiffChange[]): string[] {
    return changes
      .filter((change) => change.entropy.level === 'high' || change.entropy.level === 'critical')
      .map((change) => change.path)
      .slice(0, 10); // Top 10 hotspots
  }

  /**
   * Determine risk level from entropy score
   */
  private determineRiskLevel(entropyScore: number): EntropyLevel {
    if (entropyScore === 0) return 'none';
    if (entropyScore < 0.3) return 'low';
    if (entropyScore < 0.6) return 'medium';
    if (entropyScore < 0.8) return 'high';
    return 'critical';
  }
}
