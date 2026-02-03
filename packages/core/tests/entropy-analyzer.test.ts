/**
 * SED - Semantic Entropy Differencing
 * Entropy Analyzer Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntropyAnalyzer } from '../src/entropy/entropy-analyzer.js';
import type { NodeEntropy, EntropyLevel } from '@sed/shared/types';

describe('EntropyAnalyzer', () => {
  let analyzer: EntropyAnalyzer;

  beforeEach(() => {
    analyzer = new EntropyAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze entropy collection', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('func1', 'function', 0.3, 'low'),
        createNodeEntropy('func2', 'function', 0.5, 'moderate'),
        createNodeEntropy('class1', 'class', 0.7, 'high'),
      ];

      const result = analyzer.analyze(entropies);

      expect(result).toBeDefined();
      expect(result.totalEntropy).toBeGreaterThan(0);
      expect(result.level).toBeDefined();
      expect(result.distribution).toBeDefined();
    });

    it('should handle empty input', () => {
      const result = analyzer.analyze([]);

      expect(result.totalEntropy).toBe(0);
      expect(result.level).toBe('minimal');
      expect(result.hotspots).toHaveLength(0);
    });

    it('should include hotspots sorted by entropy', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('low', 'function', 0.2, 'low'),
        createNodeEntropy('high', 'function', 0.8, 'high'),
        createNodeEntropy('critical', 'class', 0.95, 'critical'),
        createNodeEntropy('moderate', 'interface', 0.5, 'moderate'),
      ];

      const result = analyzer.analyze(entropies);

      expect(result.hotspots.length).toBeGreaterThan(0);
      expect(result.hotspots[0].normalizedEntropy).toBe(0.95);
    });

    it('should calculate distribution by level', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('a', 'function', 0.1, 'minimal'),
        createNodeEntropy('b', 'function', 0.2, 'low'),
        createNodeEntropy('c', 'function', 0.2, 'low'),
        createNodeEntropy('d', 'function', 0.5, 'moderate'),
      ];

      const result = analyzer.analyze(entropies);

      expect(result.distribution.minimal).toBe(1);
      expect(result.distribution.low).toBe(2);
      expect(result.distribution.moderate).toBe(1);
    });

    it('should calculate average entropy', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('a', 'function', 0.2, 'low'),
        createNodeEntropy('b', 'function', 0.4, 'moderate'),
        createNodeEntropy('c', 'function', 0.6, 'high'),
      ];

      const result = analyzer.analyze(entropies);

      expect(result.averageEntropy).toBeCloseTo(0.4, 2);
    });
  });

  describe('detectHotspots', () => {
    it('should detect high entropy nodes', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('normal', 'function', 0.3, 'low'),
        createNodeEntropy('hotspot1', 'class', 0.85, 'high'),
        createNodeEntropy('hotspot2', 'module', 0.95, 'critical'),
      ];

      const hotspots = analyzer.detectHotspots(entropies);

      expect(hotspots.length).toBe(2);
      expect(hotspots.map((h) => h.nodeName)).toContain('hotspot1');
      expect(hotspots.map((h) => h.nodeName)).toContain('hotspot2');
    });

    it('should respect maxHotspots limit', () => {
      const entropies: NodeEntropy[] = Array.from({ length: 20 }, (_, i) =>
        createNodeEntropy(`func${i}`, 'function', 0.8 + i * 0.01, 'high')
      );

      const hotspots = analyzer.detectHotspots(entropies, { maxHotspots: 5 });

      expect(hotspots.length).toBe(5);
    });

    it('should filter by threshold', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('low', 'function', 0.3, 'low'),
        createNodeEntropy('moderate', 'function', 0.5, 'moderate'),
        createNodeEntropy('high', 'function', 0.8, 'high'),
      ];

      const hotspots = analyzer.detectHotspots(entropies, {
        threshold: 0.6,
      });

      expect(hotspots.length).toBe(1);
      expect(hotspots[0].nodeName).toBe('high');
    });
  });

  describe('getRecommendations', () => {
    it('should return no recommendations for minimal entropy', () => {
      const result = analyzer.analyze([createNodeEntropy('a', 'function', 0.05, 'minimal')]);

      const recommendations = analyzer.getRecommendations(result);

      expect(recommendations.length).toBe(0);
    });

    it('should recommend review for high entropy', () => {
      const result = analyzer.analyze([createNodeEntropy('a', 'class', 0.8, 'high')]);

      const recommendations = analyzer.getRecommendations(result);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(
        recommendations.some(
          (r) => r.toLowerCase().includes('review') || r.toLowerCase().includes('careful')
        )
      ).toBe(true);
    });

    it('should provide specific recommendations for critical entropy', () => {
      const result = analyzer.analyze([createNodeEntropy('a', 'module', 0.95, 'critical')]);

      const recommendations = analyzer.getRecommendations(result);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend splitting for many hotspots', () => {
      const entropies: NodeEntropy[] = Array.from({ length: 10 }, (_, i) =>
        createNodeEntropy(`func${i}`, 'function', 0.85, 'high')
      );

      const result = analyzer.analyze(entropies);
      const recommendations = analyzer.getRecommendations(result);

      expect(
        recommendations.some(
          (r) => r.toLowerCase().includes('split') || r.toLowerCase().includes('smaller')
        )
      ).toBe(true);
    });
  });

  describe('calculateDistribution', () => {
    it('should calculate level distribution', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('a', 'function', 0.05, 'minimal'),
        createNodeEntropy('b', 'function', 0.15, 'low'),
        createNodeEntropy('c', 'function', 0.35, 'moderate'),
        createNodeEntropy('d', 'function', 0.65, 'high'),
        createNodeEntropy('e', 'function', 0.92, 'critical'),
      ];

      const distribution = analyzer.calculateDistribution(entropies);

      expect(distribution.minimal).toBe(1);
      expect(distribution.low).toBe(1);
      expect(distribution.moderate).toBe(1);
      expect(distribution.high).toBe(1);
      expect(distribution.critical).toBe(1);
    });

    it('should handle all same level', () => {
      const entropies: NodeEntropy[] = [
        createNodeEntropy('a', 'function', 0.3, 'low'),
        createNodeEntropy('b', 'function', 0.25, 'low'),
        createNodeEntropy('c', 'function', 0.28, 'low'),
      ];

      const distribution = analyzer.calculateDistribution(entropies);

      expect(distribution.low).toBe(3);
      expect(distribution.minimal).toBe(0);
      expect(distribution.moderate).toBe(0);
    });
  });

  describe('compareAnalyses', () => {
    it('should compare two analyses', () => {
      const before = analyzer.analyze([createNodeEntropy('a', 'function', 0.3, 'low')]);
      const after = analyzer.analyze([createNodeEntropy('a', 'function', 0.5, 'moderate')]);

      const comparison = analyzer.compareAnalyses(before, after);

      expect(comparison.entropyDelta).toBeGreaterThan(0);
      expect(comparison.levelChange).toBeDefined();
    });

    it('should detect improvement', () => {
      const before = analyzer.analyze([createNodeEntropy('a', 'function', 0.8, 'high')]);
      const after = analyzer.analyze([createNodeEntropy('a', 'function', 0.3, 'low')]);

      const comparison = analyzer.compareAnalyses(before, after);

      expect(comparison.improved).toBe(true);
    });

    it('should detect regression', () => {
      const before = analyzer.analyze([createNodeEntropy('a', 'function', 0.3, 'low')]);
      const after = analyzer.analyze([createNodeEntropy('a', 'function', 0.9, 'critical')]);

      const comparison = analyzer.compareAnalyses(before, after);

      expect(comparison.regressed).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect custom thresholds', () => {
      const customAnalyzer = new EntropyAnalyzer({
        thresholds: {
          minimal: 0.1,
          low: 0.2,
          moderate: 0.4,
          high: 0.6,
          critical: 0.8,
        },
      });

      // With custom thresholds, 0.5 should be moderate/high
      const result = customAnalyzer.analyze([createNodeEntropy('a', 'function', 0.5, 'moderate')]);

      expect(['moderate', 'high']).toContain(result.level);
    });

    it('should respect hotspot configuration', () => {
      const limitedAnalyzer = new EntropyAnalyzer({
        maxHotspots: 3,
        hotspotThreshold: 0.7,
      });

      const entropies = Array.from({ length: 10 }, (_, i) =>
        createNodeEntropy(`func${i}`, 'function', 0.75 + i * 0.02, 'high')
      );

      const result = limitedAnalyzer.analyze(entropies);

      expect(result.hotspots.length).toBeLessThanOrEqual(3);
    });
  });
});

// Helper function
function createNodeEntropy(
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
