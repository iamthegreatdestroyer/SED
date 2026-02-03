/**
 * SED - Semantic Entropy Differencing
 * Change Classifier Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeClassifier } from '../src/engine/change-classifier.js';
import type { SemanticChange, NodeEntropy, EntropyLevel } from '@sed/shared/types';

describe('ChangeClassifier', () => {
  let classifier: ChangeClassifier;

  beforeEach(() => {
    classifier = new ChangeClassifier();
  });

  describe('classify', () => {
    it('should classify a simple change', () => {
      const change = createChange('modified', 'function', 'myFunction');
      const entropy = createEntropy('myFunction', 'function', 0.3, 'low');

      const result = classifier.classify(change, entropy);

      expect(result).toBeDefined();
      expect(result.change).toBe(change);
      expect(result.entropy).toBe(entropy);
      expect(result.level).toBe('low');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.rationale).toContain('Modified function');
    });

    it('should mark interface changes as breaking potential', () => {
      const change = createChange('modified', 'interface', 'MyInterface');
      const entropy = createEntropy('MyInterface', 'interface', 0.5, 'moderate');

      const result = classifier.classify(change, entropy);

      expect(result.tags).toContain('breaking-potential');
      expect(result.riskScore).toBeGreaterThan(entropy.normalizedEntropy);
    });

    it('should mark export changes as public API', () => {
      const change = createChange('modified', 'export', 'exportedValue');
      const entropy = createEntropy('exportedValue', 'export', 0.4, 'low');

      const result = classifier.classify(change, entropy);

      expect(result.tags).toContain('public-api');
    });

    it('should mark removals with removal tag', () => {
      const change = createChange('removed', 'function', 'removedFunc');
      const entropy = createEntropy('removedFunc', 'function', 0.5, 'moderate');

      const result = classifier.classify(change, entropy);

      expect(result.tags).toContain('removal');
    });

    it('should require review for critical entropy', () => {
      const change = createChange('modified', 'module', 'CriticalModule');
      const entropy = createEntropy('CriticalModule', 'module', 0.95, 'critical');

      const result = classifier.classify(change, entropy);

      expect(result.reviewRequired).toBe(true);
      expect(result.level).toBe('critical');
    });

    it('should require review for high entropy', () => {
      const change = createChange('modified', 'class', 'HighEntropyClass');
      const entropy = createEntropy('HighEntropyClass', 'class', 0.75, 'high');

      const result = classifier.classify(change, entropy);

      expect(result.reviewRequired).toBe(true);
    });

    it('should not require review for minimal entropy', () => {
      const change = createChange('added', 'variable', 'simpleVar');
      const entropy = createEntropy('simpleVar', 'variable', 0.05, 'minimal');

      const result = classifier.classify(change, entropy);

      expect(result.reviewRequired).toBe(false);
    });
  });

  describe('classifyBatch', () => {
    it('should classify multiple changes', () => {
      const changes: SemanticChange[] = [
        createChange('added', 'function', 'func1'),
        createChange('modified', 'function', 'func2'),
        createChange('removed', 'function', 'func3'),
      ];

      const entropies = new Map<string, NodeEntropy>([
        ['node-func1', createEntropy('func1', 'function', 0.2, 'low')],
        ['node-func2', createEntropy('func2', 'function', 0.4, 'moderate')],
        ['node-func3', createEntropy('func3', 'function', 0.3, 'low')],
      ]);

      const results = classifier.classifyBatch(changes, entropies);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.rationale)).toBe(true);
    });

    it('should handle missing entropies with defaults', () => {
      const changes: SemanticChange[] = [
        createChange('added', 'function', 'unknownFunc'),
      ];

      const entropies = new Map<string, NodeEntropy>();

      const results = classifier.classifyBatch(changes, entropies);

      expect(results).toHaveLength(1);
      expect(results[0].level).toBe('minimal');
    });
  });

  describe('getReviewRequired', () => {
    it('should return only changes requiring review', () => {
      const classifications = [
        createClassification('high', true, 0.8),
        createClassification('low', false, 0.2),
        createClassification('critical', true, 0.95),
        createClassification('minimal', false, 0.05),
      ];

      const result = classifier.getReviewRequired(classifications);

      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('critical'); // Sorted by risk score
      expect(result[1].level).toBe('high');
    });
  });

  describe('getByLevel', () => {
    it('should filter by entropy level', () => {
      const classifications = [
        createClassification('high', true, 0.8),
        createClassification('high', true, 0.75),
        createClassification('low', false, 0.2),
        createClassification('moderate', false, 0.5),
      ];

      const high = classifier.getByLevel(classifications, 'high');
      const low = classifier.getByLevel(classifications, 'low');

      expect(high).toHaveLength(2);
      expect(low).toHaveLength(1);
    });
  });

  describe('getByTag', () => {
    it('should filter by tag', () => {
      const classifications = [
        createClassificationWithTags(['breaking-potential', 'public-api']),
        createClassificationWithTags(['public-api']),
        createClassificationWithTags(['removal']),
      ];

      const breakingPotential = classifier.getByTag(classifications, 'breaking-potential');
      const publicApi = classifier.getByTag(classifications, 'public-api');

      expect(breakingPotential).toHaveLength(1);
      expect(publicApi).toHaveLength(2);
    });
  });

  describe('generateSummary', () => {
    it('should generate comprehensive summary', () => {
      const classifications = [
        createClassification('high', true, 0.8),
        createClassification('moderate', false, 0.5),
        createClassification('low', false, 0.2),
        createClassification('critical', true, 0.95),
      ];

      const summary = classifier.generateSummary(classifications);

      expect(summary.totalChanges).toBe(4);
      expect(summary.requireReview).toBe(2);
      expect(summary.byLevel.high).toBe(1);
      expect(summary.byLevel.critical).toBe(1);
      expect(summary.averageRiskScore).toBeGreaterThan(0);
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it('should generate critical warning recommendation', () => {
      const classifications = [
        createClassification('critical', true, 0.95),
      ];

      const summary = classifier.generateSummary(classifications);

      expect(summary.recommendations.some((r) => r.includes('critical'))).toBe(true);
    });

    it('should handle empty classifications', () => {
      const summary = classifier.generateSummary([]);

      expect(summary.totalChanges).toBe(0);
      expect(summary.requireReview).toBe(0);
      expect(summary.averageRiskScore).toBe(0);
    });
  });

  describe('custom rules', () => {
    it('should apply custom classification rules', () => {
      const customClassifier = new ChangeClassifier({
        customRules: [
          {
            name: 'test_rule',
            condition: (change) => change.nodeName.startsWith('test'),
            tag: 'test-file',
            riskMultiplier: 0.5,
            description: 'Test files have lower risk',
          },
        ],
      });

      const change = createChange('modified', 'function', 'testFunction');
      const entropy = createEntropy('testFunction', 'function', 0.5, 'moderate');

      const result = customClassifier.classify(change, entropy);

      expect(result.tags).toContain('test-file');
      expect(result.riskScore).toBeLessThan(entropy.normalizedEntropy);
    });

    it('should add rules dynamically', () => {
      classifier.addRule({
        name: 'dynamic_rule',
        condition: (change) => change.nodeType === 'component',
        tag: 'ui-component',
        riskMultiplier: 1.2,
        description: 'UI components need visual review',
      });

      const change = createChange('modified', 'component', 'Button');
      const entropy = createEntropy('Button', 'component', 0.4, 'moderate');

      const result = classifier.classify(change, entropy);

      expect(result.tags).toContain('ui-component');
    });
  });
});

// Helper functions

function createChange(
  changeType: 'added' | 'removed' | 'modified',
  nodeType: string,
  nodeName: string
): SemanticChange {
  return {
    changeType,
    nodeId: `node-${nodeName}`,
    nodeName,
    nodeType,
  };
}

function createEntropy(
  nodeName: string,
  nodeType: string,
  normalizedEntropy: number,
  level: EntropyLevel
): NodeEntropy {
  return {
    nodeId: `node-${nodeName}`,
    nodeName,
    nodeType,
    entropy: normalizedEntropy * 10,
    normalizedEntropy,
    level,
    changeType: 'modified',
  };
}

function createClassification(
  level: EntropyLevel,
  reviewRequired: boolean,
  riskScore: number
): {
  change: SemanticChange;
  entropy: NodeEntropy;
  level: EntropyLevel;
  riskScore: number;
  reviewRequired: boolean;
  tags: string[];
  rationale: string;
} {
  return {
    change: createChange('modified', 'function', `func-${level}`),
    entropy: createEntropy(`func-${level}`, 'function', riskScore, level),
    level,
    riskScore,
    reviewRequired,
    tags: [],
    rationale: `Test classification at ${level} level`,
  };
}

function createClassificationWithTags(tags: string[]): {
  change: SemanticChange;
  entropy: NodeEntropy;
  level: EntropyLevel;
  riskScore: number;
  reviewRequired: boolean;
  tags: string[];
  rationale: string;
} {
  return {
    ...createClassification('moderate', false, 0.5),
    tags,
  };
}
