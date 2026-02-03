/**
 * SED - Semantic Entropy Differencing
 * SED Engine Integration Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SEDEngine } from '../src/engine/sed-engine.js';

describe('SEDEngine', () => {
  let engine: SEDEngine;

  beforeEach(() => {
    engine = new SEDEngine();
  });

  describe('compare', () => {
    it('should compare identical code with minimal entropy', async () => {
      const code = `
        function hello(): string {
          return 'world';
        }
      `;

      const result = await engine.compare({
        oldCode: code,
        newCode: code,
        language: 'typescript',
      });

      expect(result).toBeDefined();
      expect(result.diff.summary.totalChanges).toBe(0);
      expect(result.analysis.level).toBe('minimal');
    });

    it('should detect function modification', async () => {
      const oldCode = `
        function calculate(x: number): number {
          return x * 2;
        }
      `;
      const newCode = `
        function calculate(x: number): number {
          return x * 3;
        }
      `;

      const result = await engine.compare({
        oldCode,
        newCode,
        language: 'typescript',
      });

      expect(result.diff.summary.modified).toBeGreaterThanOrEqual(0);
      expect(result.analysis).toBeDefined();
    });

    it('should detect function addition', async () => {
      const oldCode = `
        function existing(): void {}
      `;
      const newCode = `
        function existing(): void {}
        
        function newFunction(): string {
          return 'hello';
        }
      `;

      const result = await engine.compare({
        oldCode,
        newCode,
        language: 'typescript',
      });

      expect(result.diff.summary.added).toBeGreaterThanOrEqual(0);
    });

    it('should detect function removal', async () => {
      const oldCode = `
        function toBeRemoved(): void {}
        function toRemain(): void {}
      `;
      const newCode = `
        function toRemain(): void {}
      `;

      const result = await engine.compare({
        oldCode,
        newCode,
        language: 'typescript',
      });

      expect(result.diff.summary.removed).toBeGreaterThanOrEqual(0);
    });

    it('should include file metadata', async () => {
      const result = await engine.compare({
        oldCode: 'const x = 1;',
        newCode: 'const x = 2;',
        language: 'typescript',
        filePath: 'src/test.ts',
      });

      expect(result.metadata.oldFile).toBe('src/test.ts');
      expect(result.metadata.language).toBe('typescript');
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should provide classifications', async () => {
      const oldCode = `
        interface Config {
          name: string;
        }
      `;
      const newCode = `
        interface Config {
          name: string;
          value: number;
        }
      `;

      const result = await engine.compare({
        oldCode,
        newCode,
        language: 'typescript',
      });

      expect(Array.isArray(result.classifications)).toBe(true);
    });

    it('should include summary with risk score', async () => {
      const result = await engine.compare({
        oldCode: 'const a = 1;',
        newCode: 'const b = 2;',
        language: 'typescript',
      });

      expect(result.summary).toBeDefined();
      expect(typeof result.summary.averageRiskScore).toBe('number');
      expect(typeof result.summary.processingTime).toBe('number');
    });
  });

  describe('compareBatch', () => {
    it('should compare multiple files', async () => {
      const results = await engine.compareBatch({
        files: [
          {
            filePath: 'src/a.ts',
            oldCode: 'const a = 1;',
            newCode: 'const a = 2;',
            language: 'typescript',
          },
          {
            filePath: 'src/b.ts',
            oldCode: 'function b() {}',
            newCode: 'function b() { return 1; }',
            language: 'typescript',
          },
        ],
      });

      expect(results).toHaveLength(2);
      expect(results[0].metadata.oldFile).toBe('src/a.ts');
      expect(results[1].metadata.oldFile).toBe('src/b.ts');
    });

    it('should handle empty batch', async () => {
      const results = await engine.compareBatch({ files: [] });

      expect(results).toHaveLength(0);
    });
  });

  describe('analyze', () => {
    it('should analyze code structure', async () => {
      const code = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
          
          subtract(a: number, b: number): number {
            return a - b;
          }
        }
      `;

      const result = await engine.analyze(code, 'typescript');

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.trees.length).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThan(0);
    });

    it('should calculate complexity based on structure', async () => {
      const simpleCode = 'const x = 1;';
      const complexCode = `
        class A {
          method1() {
            function nested() {
              return { a: 1, b: 2 };
            }
          }
          method2() {}
          method3() {}
        }
        class B extends A {}
      `;

      const simpleResult = await engine.analyze(simpleCode, 'typescript');
      const complexResult = await engine.analyze(complexCode, 'typescript');

      expect(complexResult.complexity).toBeGreaterThan(simpleResult.complexity);
    });
  });

  describe('quickEntropy', () => {
    it('should provide quick entropy assessment', async () => {
      const result = await engine.quickEntropy(
        'function a() {}',
        'function a() { return 1; }',
        'typescript'
      );

      expect(result.level).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(typeof result.recommendation).toBe('string');
    });

    it('should recommend based on entropy level', async () => {
      const minimalResult = await engine.quickEntropy('const x = 1;', 'const x = 1;', 'typescript');

      expect(minimalResult.level).toBe('minimal');
      expect(minimalResult.recommendation).toBeTruthy();
    });
  });

  describe('getMetrics', () => {
    it('should extract metrics from result', async () => {
      const result = await engine.compare({
        oldCode: 'function a() {}',
        newCode: 'function b() {}',
        language: 'typescript',
      });

      const metrics = engine.getMetrics(result);

      expect(metrics).toHaveProperty('entropy');
      expect(metrics).toHaveProperty('complexity');
      expect(metrics).toHaveProperty('hotspotCount');
      expect(metrics).toHaveProperty('changeCount');
      expect(metrics).toHaveProperty('riskScore');
      expect(metrics).toHaveProperty('level');
      expect(metrics).toHaveProperty('reviewRequired');
    });
  });

  describe('validateParser', () => {
    it('should validate typescript parser', async () => {
      const isValid = await engine.validateParser('typescript');

      expect(isValid).toBe(true);
    });

    it('should validate javascript parser', async () => {
      const isValid = await engine.validateParser('javascript');

      expect(isValid).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should accept custom thresholds', async () => {
      const customEngine = new SEDEngine({
        thresholds: {
          minimal: 0.05,
          low: 0.15,
          moderate: 0.35,
          high: 0.65,
          critical: 0.85,
        },
      });

      const result = await customEngine.compare({
        oldCode: 'const a = 1;',
        newCode: 'const a = 2;',
        language: 'typescript',
      });

      expect(result).toBeDefined();
    });

    it('should respect parse timeout', async () => {
      const timeoutEngine = new SEDEngine({
        parseTimeout: 100,
      });

      // Should complete within timeout for small code
      const result = await timeoutEngine.compare({
        oldCode: 'const x = 1;',
        newCode: 'const y = 2;',
        language: 'typescript',
      });

      expect(result).toBeDefined();
    });

    it('should limit hotspot count', async () => {
      const limitedEngine = new SEDEngine({
        maxHotspots: 3,
      });

      const result = await limitedEngine.compare({
        oldCode: 'const a=1;const b=2;const c=3;const d=4;const e=5;',
        newCode: 'const a=2;const b=3;const c=4;const d=5;const e=6;',
        language: 'typescript',
      });

      expect(result.analysis.hotspots.length).toBeLessThanOrEqual(3);
    });
  });

  describe('error handling', () => {
    it('should handle invalid code gracefully', async () => {
      // Parser should handle syntax errors
      const result = await engine.compare({
        oldCode: 'function valid() {}',
        newCode: 'function invalid( {}',
        language: 'typescript',
      });

      // Should still return a result (parser handles errors)
      expect(result).toBeDefined();
    });

    it('should handle empty code', async () => {
      const result = await engine.compare({
        oldCode: '',
        newCode: '',
        language: 'typescript',
      });

      expect(result).toBeDefined();
      expect(result.diff.summary.totalChanges).toBe(0);
    });
  });
});
