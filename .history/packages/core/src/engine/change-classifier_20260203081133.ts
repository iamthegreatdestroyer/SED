/**
 * SED - Semantic Entropy Differencing
 * Change Classifier - Entropy-Based Classification
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SemanticChange,
  NodeEntropy,
  EntropyLevel,
  EntropyThresholds,
} from '@sed/shared/types';
import { DEFAULT_ENTROPY_THRESHOLDS } from '@sed/shared/types';
import { classifyEntropyLevel } from '@sed/shared/utils';

/**
 * Classification result for a change
 */
interface ChangeClassification {
  readonly change: SemanticChange;
  readonly entropy: NodeEntropy;
  readonly level: EntropyLevel;
  readonly riskScore: number;
  readonly reviewRequired: boolean;
  readonly tags: string[];
  readonly rationale: string;
}

/**
 * Classification rule
 */
interface ClassificationRule {
  readonly name: string;
  readonly condition: (change: SemanticChange, entropy: NodeEntropy) => boolean;
  readonly tag: string;
  readonly riskMultiplier: number;
  readonly description: string;
}

/**
 * Classification options
 */
interface ClassificationOptions {
  thresholds?: EntropyThresholds;
  reviewThreshold?: number;
  customRules?: ClassificationRule[];
}

/**
 * Default classification options
 */
const DEFAULT_OPTIONS: Required<ClassificationOptions> = {
  thresholds: DEFAULT_ENTROPY_THRESHOLDS,
  reviewThreshold: 0.5,
  customRules: [],
};

/**
 * Built-in classification rules
 */
const BUILT_IN_RULES: ClassificationRule[] = [
  {
    name: 'interface_change',
    condition: (change) => change.nodeType === 'interface',
    tag: 'breaking-potential',
    riskMultiplier: 1.5,
    description: 'Interface changes may break implementations',
  },
  {
    name: 'public_api',
    condition: (change) => change.nodeType === 'export',
    tag: 'public-api',
    riskMultiplier: 1.4,
    description: 'Changes to public API affect consumers',
  },
  {
    name: 'type_definition',
    condition: (change) => change.nodeType === 'type',
    tag: 'type-system',
    riskMultiplier: 1.3,
    description: 'Type changes affect type checking',
  },
  {
    name: 'class_modification',
    condition: (change) => 
      change.nodeType === 'class' && change.changeType === 'modified',
    tag: 'class-change',
    riskMultiplier: 1.2,
    description: 'Class modifications may affect inheritance',
  },
  {
    name: 'removal',
    condition: (change) => change.changeType === 'removed',
    tag: 'removal',
    riskMultiplier: 1.3,
    description: 'Removed code may be depended upon',
  },
  {
    name: 'large_addition',
    condition: (change, entropy) => 
      change.changeType === 'added' && entropy.normalizedEntropy > 0.6,
    tag: 'large-addition',
    riskMultiplier: 1.1,
    description: 'Large new additions need thorough review',
  },
  {
    name: 'structural_change',
    condition: (change) => 
      change.modifications?.some((m) => m.type === 'structure') ?? false,
    tag: 'structural',
    riskMultiplier: 1.25,
    description: 'Structural changes affect code organization',
  },
];

/**
 * Change Classifier
 * 
 * Classifies code changes based on entropy and semantic rules,
 * providing risk assessment and review recommendations.
 */
export class ChangeClassifier {
  private readonly options: Required<ClassificationOptions>;
  private readonly rules: ClassificationRule[];

  constructor(options: ClassificationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.rules = [...BUILT_IN_RULES, ...this.options.customRules];
  }

  /**
   * Classify a single change
   */
  classify(
    change: SemanticChange,
    entropy: NodeEntropy
  ): ChangeClassification {
    // Find matching rules
    const matchingRules = this.rules.filter((rule) =>
      rule.condition(change, entropy)
    );

    // Collect tags
    const tags = matchingRules.map((r) => r.tag);

    // Calculate risk score
    let riskScore = entropy.normalizedEntropy;
    for (const rule of matchingRules) {
      riskScore *= rule.riskMultiplier;
    }
    riskScore = Math.min(1, riskScore); // Cap at 1

    // Determine review requirement
    const reviewRequired = 
      riskScore >= this.options.reviewThreshold ||
      entropy.level === 'critical' ||
      entropy.level === 'high';

    // Build rationale
    const rationale = this.buildRationale(change, entropy, matchingRules);

    return {
      change,
      entropy,
      level: entropy.level,
      riskScore,
      reviewRequired,
      tags,
      rationale,
    };
  }

  /**
   * Classify multiple changes
   */
  classifyBatch(
    changes: SemanticChange[],
    entropies: Map<string, NodeEntropy>
  ): ChangeClassification[] {
    return changes.map((change) => {
      const entropy = entropies.get(change.nodeId);
      if (!entropy) {
        // Create default entropy for untracked changes
        const defaultEntropy: NodeEntropy = {
          nodeId: change.nodeId,
          nodeName: change.nodeName,
          nodeType: change.nodeType,
          entropy: 0,
          normalizedEntropy: 0,
          level: 'minimal',
          changeType: change.changeType,
        };
        return this.classify(change, defaultEntropy);
      }
      return this.classify(change, entropy);
    });
  }

  /**
   * Get changes requiring review
   */
  getReviewRequired(
    classifications: ChangeClassification[]
  ): ChangeClassification[] {
    return classifications
      .filter((c) => c.reviewRequired)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get changes by level
   */
  getByLevel(
    classifications: ChangeClassification[],
    level: EntropyLevel
  ): ChangeClassification[] {
    return classifications.filter((c) => c.level === level);
  }

  /**
   * Get changes with specific tag
   */
  getByTag(
    classifications: ChangeClassification[],
    tag: string
  ): ChangeClassification[] {
    return classifications.filter((c) => c.tags.includes(tag));
  }

  /**
   * Generate review summary
   */
  generateSummary(classifications: ChangeClassification[]): {
    totalChanges: number;
    requireReview: number;
    byLevel: Record<EntropyLevel, number>;
    topTags: Array<{ tag: string; count: number }>;
    averageRiskScore: number;
    recommendations: string[];
  } {
    const requireReview = classifications.filter((c) => c.reviewRequired).length;

    // Count by level
    const byLevel: Record<EntropyLevel, number> = {
      minimal: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };
    for (const classification of classifications) {
      byLevel[classification.level]++;
    }

    // Count tags
    const tagCounts = new Map<string, number>();
    for (const classification of classifications) {
      for (const tag of classification.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average risk
    const averageRiskScore =
      classifications.length > 0
        ? classifications.reduce((sum, c) => sum + c.riskScore, 0) /
          classifications.length
        : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      classifications,
      byLevel,
      topTags
    );

    return {
      totalChanges: classifications.length,
      requireReview,
      byLevel,
      topTags,
      averageRiskScore,
      recommendations,
    };
  }

  /**
   * Add a custom classification rule
   */
  addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
  }

  // Private methods

  /**
   * Build human-readable rationale
   */
  private buildRationale(
    change: SemanticChange,
    entropy: NodeEntropy,
    matchingRules: ClassificationRule[]
  ): string {
    const parts: string[] = [];

    // Base description
    parts.push(
      `${change.changeType.charAt(0).toUpperCase() + change.changeType.slice(1)} ${
        change.nodeType
      } "${change.nodeName}"`
    );

    // Entropy level
    parts.push(`with ${entropy.level} entropy (${(entropy.normalizedEntropy * 100).toFixed(1)}%)`);

    // Matching rules
    if (matchingRules.length > 0) {
      const ruleDescriptions = matchingRules
        .map((r) => r.description)
        .slice(0, 3)
        .join('; ');
      parts.push(`- ${ruleDescriptions}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    classifications: ChangeClassification[],
    byLevel: Record<EntropyLevel, number>,
    topTags: Array<{ tag: string; count: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Critical/high entropy
    if (byLevel.critical > 0) {
      recommendations.push(
        `⚠️ ${byLevel.critical} critical entropy change(s) detected. Mandatory detailed review.`
      );
    }

    if (byLevel.high > 2) {
      recommendations.push(
        `⚡ Multiple high-entropy changes. Consider splitting into smaller PRs.`
      );
    }

    // Breaking potential
    const breakingTag = topTags.find((t) => t.tag === 'breaking-potential');
    if (breakingTag && breakingTag.count > 0) {
      recommendations.push(
        `🔴 ${breakingTag.count} change(s) with breaking potential. Check downstream impact.`
      );
    }

    // Removals
    const removals = classifications.filter((c) => c.change.changeType === 'removed');
    if (removals.length > 3) {
      recommendations.push(
        `🗑️ ${removals.length} removals detected. Ensure proper deprecation notices were given.`
      );
    }

    // Public API
    const apiTag = topTags.find((t) => t.tag === 'public-api');
    if (apiTag && apiTag.count > 0) {
      recommendations.push(
        `📦 ${apiTag.count} public API change(s). Update documentation and changelog.`
      );
    }

    // General size
    if (classifications.length > 20) {
      recommendations.push(
        `📊 Large changeset (${classifications.length} changes). Consider incremental review.`
      );
    }

    return recommendations;
  }
}
