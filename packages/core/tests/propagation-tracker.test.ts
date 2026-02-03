/**
 * SED - Semantic Entropy Differencing
 * Propagation Tracker Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PropagationTracker } from '../src/entropy/propagation-tracker.js';
import type { Change, PropagationPath, PropagationImpact } from '@sed/shared/types';

describe('PropagationTracker', () => {
  let tracker: PropagationTracker;

  beforeEach(() => {
    tracker = new PropagationTracker();
  });

  describe('trackPropagation', () => {
    it('should track change propagation', () => {
      const change = createChange('parent', 'class', 'modified');
      const affectedChildren = [
        createChange('child1', 'function', 'affected'),
        createChange('child2', 'function', 'affected'),
      ];

      const paths = tracker.trackPropagation(change, affectedChildren);

      expect(paths.length).toBe(2);
      expect(paths[0].source).toBe('parent');
      expect(paths[0].targets).toContain('child1');
    });

    it('should calculate propagation depth', () => {
      const change = createChange('root', 'module', 'modified');
      const level1 = [createChange('class1', 'class', 'affected')];
      const level2 = [
        createChange('method1', 'function', 'affected'),
        createChange('method2', 'function', 'affected'),
      ];

      const paths = tracker.trackPropagation(change, [...level1, ...level2], {
        depth: 2,
      });

      expect(paths.some((p) => p.depth >= 2)).toBe(true);
    });

    it('should handle no affected nodes', () => {
      const change = createChange('isolated', 'function', 'modified');

      const paths = tracker.trackPropagation(change, []);

      expect(paths).toHaveLength(0);
    });

    it('should include propagation type', () => {
      const change = createChange('interface', 'interface', 'modified');
      const affected = [createChange('impl', 'class', 'affected')];

      const paths = tracker.trackPropagation(change, affected);

      expect(paths[0].propagationType).toBeDefined();
      expect(['direct', 'transitive', 'interface', 'inheritance']).toContain(
        paths[0].propagationType
      );
    });
  });

  describe('analyzePropagation', () => {
    it('should analyze propagation impact', () => {
      const changes: Change[] = [
        createChange('parent', 'class', 'modified'),
        createChange('child', 'function', 'modified'),
      ];

      const impact = tracker.analyzePropagation(changes);

      expect(impact).toBeDefined();
      expect(impact.totalAffected).toBeGreaterThanOrEqual(0);
      expect(impact.propagationDepth).toBeGreaterThanOrEqual(0);
    });

    it('should identify impact level', () => {
      const manyChanges: Change[] = Array.from({ length: 20 }, (_, i) =>
        createChange(`node${i}`, 'function', 'modified')
      );

      const impact = tracker.analyzePropagation(manyChanges);

      expect(impact.impactLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(impact.impactLevel);
    });

    it('should detect cascading changes', () => {
      const changes: Change[] = [
        createChange('interface', 'interface', 'modified'),
        createChange('impl1', 'class', 'modified'),
        createChange('impl2', 'class', 'modified'),
        createChange('impl3', 'class', 'modified'),
      ];

      const impact = tracker.analyzePropagation(changes);

      expect(impact.cascading).toBe(true);
    });

    it('should handle empty changes', () => {
      const impact = tracker.analyzePropagation([]);

      expect(impact.totalAffected).toBe(0);
      expect(impact.impactLevel).toBe('low');
      expect(impact.cascading).toBe(false);
    });
  });

  describe('getAffectedNodes', () => {
    it('should return all affected node IDs', () => {
      const change = createChange('source', 'class', 'modified');
      const affected = [
        createChange('target1', 'function', 'affected'),
        createChange('target2', 'function', 'affected'),
        createChange('target3', 'property', 'affected'),
      ];

      tracker.trackPropagation(change, affected);
      const affectedNodes = tracker.getAffectedNodes('source');

      expect(affectedNodes.length).toBe(3);
      expect(affectedNodes).toContain('target1');
      expect(affectedNodes).toContain('target2');
      expect(affectedNodes).toContain('target3');
    });

    it('should return empty array for unknown source', () => {
      const affected = tracker.getAffectedNodes('nonexistent');

      expect(affected).toHaveLength(0);
    });
  });

  describe('getPropagationPaths', () => {
    it('should return all propagation paths', () => {
      const change1 = createChange('source1', 'class', 'modified');
      const change2 = createChange('source2', 'class', 'modified');

      tracker.trackPropagation(change1, [createChange('target1', 'function', 'affected')]);
      tracker.trackPropagation(change2, [createChange('target2', 'function', 'affected')]);

      const paths = tracker.getPropagationPaths();

      expect(paths.length).toBe(2);
    });

    it('should filter paths by source', () => {
      const change1 = createChange('source1', 'class', 'modified');
      const change2 = createChange('source2', 'class', 'modified');

      tracker.trackPropagation(change1, [createChange('target1', 'function', 'affected')]);
      tracker.trackPropagation(change2, [createChange('target2', 'function', 'affected')]);

      const paths = tracker.getPropagationPaths({ source: 'source1' });

      expect(paths.length).toBe(1);
      expect(paths[0].source).toBe('source1');
    });
  });

  describe('calculatePropagationScore', () => {
    it('should calculate propagation score', () => {
      const changes: Change[] = [
        createChange('root', 'module', 'modified'),
        createChange('child1', 'class', 'modified'),
        createChange('child2', 'class', 'modified'),
      ];

      const score = tracker.calculatePropagationScore(changes);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 0 for no changes', () => {
      const score = tracker.calculatePropagationScore([]);

      expect(score).toBe(0);
    });

    it('should increase score for more propagation', () => {
      const fewChanges: Change[] = [createChange('a', 'function', 'modified')];

      const manyChanges: Change[] = [
        createChange('root', 'module', 'modified'),
        ...Array.from({ length: 10 }, (_, i) => createChange(`child${i}`, 'function', 'modified')),
      ];

      const fewScore = tracker.calculatePropagationScore(fewChanges);
      const manyScore = tracker.calculatePropagationScore(manyChanges);

      expect(manyScore).toBeGreaterThan(fewScore);
    });
  });

  describe('getDependencyGraph', () => {
    it('should build dependency graph from changes', () => {
      const changes: Change[] = [
        createChangeWithPath('func', 'function', 'modified', 'src/utils.ts'),
        createChangeWithPath('caller', 'function', 'modified', 'src/main.ts'),
      ];

      const graph = tracker.getDependencyGraph(changes);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
    });

    it('should identify root nodes', () => {
      const changes: Change[] = [
        createChange('root', 'module', 'modified'),
        createChange('child', 'class', 'modified'),
      ];

      const graph = tracker.getDependencyGraph(changes);

      expect(graph.roots.length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should clear tracking state', () => {
      tracker.trackPropagation(createChange('source', 'class', 'modified'), [
        createChange('target', 'function', 'affected'),
      ]);

      tracker.reset();

      const paths = tracker.getPropagationPaths();
      expect(paths).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('should respect max depth', () => {
      const limitedTracker = new PropagationTracker({
        maxDepth: 2,
      });

      const changes: Change[] = Array.from({ length: 10 }, (_, i) =>
        createChange(`node${i}`, 'function', 'modified')
      );

      const impact = limitedTracker.analyzePropagation(changes);

      expect(impact.propagationDepth).toBeLessThanOrEqual(2);
    });

    it('should respect custom impact thresholds', () => {
      const customTracker = new PropagationTracker({
        impactThresholds: {
          low: 2,
          medium: 5,
          high: 10,
          critical: 20,
        },
      });

      const changes: Change[] = Array.from({ length: 6 }, (_, i) =>
        createChange(`node${i}`, 'function', 'modified')
      );

      const impact = customTracker.analyzePropagation(changes);

      expect(impact.impactLevel).toBe('medium');
    });
  });
});

// Helper functions
function createChange(nodeId: string, nodeType: string, changeType: string): Change {
  return {
    nodeId,
    nodeType,
    nodeName: nodeId,
    changeType: changeType as any,
    before: changeType === 'added' ? null : { content: 'before', hash: 'abc' },
    after: changeType === 'removed' ? null : { content: 'after', hash: 'xyz' },
    depth: 0,
  };
}

function createChangeWithPath(
  nodeId: string,
  nodeType: string,
  changeType: string,
  filePath: string
): Change {
  return {
    ...createChange(nodeId, nodeType, changeType),
    filePath,
  };
}
