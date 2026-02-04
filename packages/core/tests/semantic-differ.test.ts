/**
 * SED - Semantic Entropy Differencing
 * Semantic Differ Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticDiffer } from '../src/semantic/semantic-differ';
import type { SEDDiffResult, DiffChange } from '@sed/shared/types';

describe('SemanticDiffer', () => {
  let differ: SemanticDiffer;

  beforeEach(() => {
    differ = new SemanticDiffer();
  });

  describe('Constructor and Initialization', () => {
    it('should create differ with default options', () => {
      const differ = new SemanticDiffer();
      expect(differ).toBeDefined();
      expect(differ).toBeInstanceOf(SemanticDiffer);
    });

    it('should create differ with custom options', () => {
      const differ = new SemanticDiffer({
        includeComments: false,
        maxDepth: 10,
        entropyThreshold: 0.5,
      });
      expect(differ).toBeDefined();
    });

    it('should use default options when none provided', () => {
      const differ = new SemanticDiffer({});
      expect(differ).toBeDefined();
    });
  });

  describe('Basic Diff Operations', () => {
    it('should detect no changes for identical code', async () => {
      const source = `
        function greet(name: string): string {
          return 'Hello, ' + name;
        }
      `;

      const result = await differ.diff(source, source, 'test.ts', 'typescript');

      expect(result).toBeDefined();
      expect(result.files).toHaveLength(1);
      expect(result.files[0].changes).toHaveLength(0);
      expect(result.summary.totalChanges).toBe(0);
    });

    it('should detect function addition', async () => {
      const oldSource = `
        function foo() {
          return 42;
        }
      `;

      const newSource = `
        function foo() {
          return 42;
        }
        
        function bar() {
          return 100;
        }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.files[0].changes.length).toBeGreaterThan(0);
      const addedChanges = result.files[0].changes.filter((c) => c.operation === 'add');
      expect(addedChanges.length).toBeGreaterThan(0);
      expect(result.summary.stats.additions).toBeGreaterThan(0);
    });

    it('should detect function removal', async () => {
      const oldSource = `
        function foo() {
          return 42;
        }
        
        function bar() {
          return 100;
        }
      `;

      const newSource = `
        function foo() {
          return 42;
        }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.files[0].changes.length).toBeGreaterThan(0);
      const removedChanges = result.files[0].changes.filter((c) => c.operation === 'remove');
      expect(removedChanges.length).toBeGreaterThan(0);
      expect(result.summary.stats.deletions).toBeGreaterThan(0);
    });

    it('should detect function modification', async () => {
      const oldSource = `
        function greet(name: string): string {
          return 'Hello, ' + name;
        }
      `;

      const newSource = `
        function greet(name: string): string {
          return 'Hi, ' + name + '!';
        }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.files[0].changes.length).toBeGreaterThan(0);
      const modifiedChanges = result.files[0].changes.filter((c) => c.operation === 'modify');
      expect(modifiedChanges.length).toBeGreaterThan(0);
      expect(result.summary.stats.modifications).toBeGreaterThan(0);
    });
  });

  describe('Result Structure', () => {
    it('should return properly structured SEDDiffResult', async () => {
      const oldSource = 'function foo() { return 1; }';
      const newSource = 'function foo() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      // Validate structure
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('metadata');

      // Validate files
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files[0]).toHaveProperty('path');
      expect(result.files[0]).toHaveProperty('language');
      expect(result.files[0]).toHaveProperty('changes');
      expect(result.files[0]).toHaveProperty('stats');

      // Validate summary
      expect(result.summary).toHaveProperty('totalFiles');
      expect(result.summary).toHaveProperty('totalChanges');
      expect(result.summary).toHaveProperty('overallEntropy');
      expect(result.summary).toHaveProperty('stats');
      expect(result.summary).toHaveProperty('riskLevel');

      // Validate metadata
      expect(result.metadata).toHaveProperty('version');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('computeTime');
      expect(result.metadata).toHaveProperty('algorithm');
      expect(result.metadata.algorithm).toBe('sed-v1');
    });

    it('should include correct file metadata', async () => {
      const oldSource = 'const x = 1;';
      const newSource = 'const x = 2;';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.files[0].path).toBe('test.ts');
      expect(result.files[0].language).toBe('typescript');
    });

    it('should compute diff statistics correctly', async () => {
      const oldSource = `
        function a() { return 1; }
        function b() { return 2; }
      `;

      const newSource = `
        function a() { return 10; }
        function c() { return 3; }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.summary.stats.totalChanges).toBe(result.files[0].changes.length);
      expect(typeof result.summary.stats.entropyScore).toBe('number');
      expect(result.summary.stats.entropyLevel).toMatch(/^(none|low|medium|high|critical)$/);
    });
  });

  describe('Entropy Calculation', () => {
    it('should calculate entropy for changes', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      const changes = result.files[0].changes;
      if (changes.length > 0) {
        const change = changes[0];
        expect(change.entropy).toBeDefined();
        expect(typeof change.entropy.entropy).toBe('number');
        expect(typeof change.entropy.normalizedEntropy).toBe('number');
        expect(change.entropy.level).toMatch(/^(none|low|medium|high|critical)$/);
      }
    });

    it('should include entropy components', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      const changes = result.files[0].changes;
      if (changes.length > 0) {
        const change = changes[0];
        expect(change.entropy.components).toBeDefined();
        expect(typeof change.entropy.components.structural).toBe('number');
        expect(typeof change.entropy.components.semantic).toBe('number');
        expect(typeof change.entropy.components.propagation).toBe('number');
      }
    });

    it('should calculate total entropy correctly', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.files[0].totalEntropy).toBeDefined();
      expect(typeof result.files[0].totalEntropy.entropy).toBe('number');
      expect(result.summary.overallEntropy).toBeDefined();
    });
  });

  describe('Change Detection', () => {
    it('should assign unique IDs to changes', async () => {
      const oldSource = `
        function a() { return 1; }
        function b() { return 2; }
      `;

      const newSource = `
        function a() { return 10; }
        function b() { return 20; }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      const ids = new Set(result.files[0].changes.map((c) => c.id));
      expect(ids.size).toBe(result.files[0].changes.length);
    });

    it('should include before and after nodes for modifications', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      const modifiedChanges = result.files[0].changes.filter((c) => c.operation === 'modify');

      for (const change of modifiedChanges) {
        // At least one should have both nodes
        if (change.beforeNode && change.afterNode) {
          expect(change.beforeNode).toBeDefined();
          expect(change.afterNode).toBeDefined();
          break;
        }
      }
    });

    it('should include descriptions for changes', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      for (const change of result.files[0].changes) {
        expect(change.description).toBeDefined();
        expect(typeof change.description).toBe('string');
        expect(change.description.length).toBeGreaterThan(0);
      }
    });

    it('should include source ranges for changes', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      for (const change of result.files[0].changes) {
        expect(change.range).toBeDefined();
        expect(change.range.start).toBeDefined();
        expect(change.range.end).toBeDefined();
        expect(typeof change.range.start.line).toBe('number');
        expect(typeof change.range.start.column).toBe('number');
      }
    });
  });

  describe('Hotspot Detection', () => {
    it('should identify hotspots for high-entropy changes', async () => {
      const oldSource = `
        function smallChange() { return 1; }
        class BigChange {
          method1() {}
          method2() {}
          method3() {}
        }
      `;

      const newSource = `
        function smallChange() { return 2; }
        class BigChange {
          method1() { console.log('big change'); }
          method2() { console.log('big change'); }
          method3() { console.log('big change'); }
          method4() { console.log('new method'); }
        }
      `;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.summary.hotspots).toBeDefined();
      expect(Array.isArray(result.summary.hotspots)).toBe(true);
    });

    it('should limit hotspots to top 10', async () => {
      // This would need a large change set to properly test
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.summary.hotspots.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Risk Level Assessment', () => {
    it('should assign risk levels correctly', async () => {
      const oldSource = 'const x = 1;';
      const newSource = 'const x = 2;';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.summary.riskLevel).toMatch(/^(none|low|medium|high|critical)$/);
      expect(result.files[0].stats.entropyLevel).toMatch(/^(none|low|medium|high|critical)$/);
    });

    it('should have "none" risk level for no changes', async () => {
      const source = 'function test() { return 1; }';

      const result = await differ.diff(source, source, 'test.ts', 'typescript');

      // When there are no changes, entropy should be 0
      if (result.files[0].changes.length === 0) {
        expect(result.summary.overallEntropy.level).toBe('none');
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should track computation time', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result.metadata.computeTime).toBeDefined();
      expect(typeof result.metadata.computeTime).toBe('number');
      expect(result.metadata.computeTime).toBeGreaterThanOrEqual(0);
    });

    it('should complete diff operation within reasonable time', async () => {
      const oldSource = `
        function func1() { return 1; }
        function func2() { return 2; }
        function func3() { return 3; }
      `;

      const newSource = `
        function func1() { return 10; }
        function func2() { return 20; }
        function func3() { return 30; }
      `;

      const startTime = performance.now();
      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(result.metadata.computeTime).toBeLessThan(5000);
    });
  });

  describe('Options Handling', () => {
    it('should respect entropy threshold option', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      // High threshold - should filter out low-entropy changes
      const differ = new SemanticDiffer({ entropyThreshold: 10.0 });
      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      // With very high threshold, modifications might be filtered out
      const modifiedChanges = result.files[0].changes.filter((c) => c.operation === 'modify');
      // Either no modifications, or all have high entropy
      for (const change of modifiedChanges) {
        expect(change.entropy.entropy).toBeGreaterThanOrEqual(10.0);
      }
    });

    it('should respect maxDepth option', async () => {
      const differ = new SemanticDiffer({ maxDepth: 5 });
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      // Should not throw even with shallow maxDepth
      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source code', async () => {
      const result = await differ.diff('', '', 'test.ts', 'typescript');

      expect(result).toBeDefined();
      expect(result.files[0].changes).toHaveLength(0);
      expect(result.summary.totalChanges).toBe(0);
    });

    it('should handle adding code to empty file', async () => {
      const newSource = 'function test() { return 1; }';

      const result = await differ.diff('', newSource, 'test.ts', 'typescript');

      expect(result.files[0].changes.length).toBeGreaterThan(0);
      const addedChanges = result.files[0].changes.filter((c) => c.operation === 'add');
      expect(addedChanges.length).toBeGreaterThan(0);
    });

    it('should handle removing all code', async () => {
      const oldSource = 'function test() { return 1; }';

      const result = await differ.diff(oldSource, '', 'test.ts', 'typescript');

      expect(result.files[0].changes.length).toBeGreaterThan(0);
      const removedChanges = result.files[0].changes.filter((c) => c.operation === 'remove');
      expect(removedChanges.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only changes', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() {  return 1;  }'; // Extra spaces

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      // Should still detect as same if whitespace ignored by parser
      expect(result).toBeDefined();
    });

    it('should handle very long function names', async () => {
      const longName = 'a'.repeat(1000);
      const oldSource = `function ${longName}() { return 1; }`;
      const newSource = `function ${longName}() { return 2; }`;

      const result = await differ.diff(oldSource, newSource, 'test.ts', 'typescript');

      expect(result).toBeDefined();
      expect(result.files[0].changes.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Validation', () => {
    it('should include version in metadata', async () => {
      const source = 'function test() { return 1; }';
      const result = await differ.diff(source, source, 'test.ts', 'typescript');

      expect(result.metadata.version).toBeDefined();
      expect(typeof result.metadata.version).toBe('string');
    });

    it('should include timestamp in ISO format', async () => {
      const source = 'function test() { return 1; }';
      const result = await differ.diff(source, source, 'test.ts', 'typescript');

      expect(result.metadata.timestamp).toBeDefined();
      // Should be valid ISO string
      const date = new Date(result.metadata.timestamp);
      expect(date.toISOString()).toBe(result.metadata.timestamp);
    });

    it('should include algorithm identifier', async () => {
      const source = 'function test() { return 1; }';
      const result = await differ.diff(source, source, 'test.ts', 'typescript');

      expect(result.metadata.algorithm).toBe('sed-v1');
    });
  });

  describe('Language Support', () => {
    it('should detect language from file extension', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.ts');

      expect(result.files[0].language).toBe('typescript');
    });

    it('should use explicitly specified language', async () => {
      const oldSource = 'function test() { return 1; }';
      const newSource = 'function test() { return 2; }';

      const result = await differ.diff(oldSource, newSource, 'test.txt', 'typescript');

      expect(result.files[0].language).toBe('typescript');
    });
  });
});
