/**
 * SED - Semantic Entropy Differencing
 * CLI Configuration Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { DEFAULT_CONFIG, validateConfig } from '../src/config/loader.js';

vi.mock('fs', () => import('memfs').then((m) => m.fs));
vi.mock('fs/promises', () => import('memfs').then((m) => m.fs.promises));

describe('CLI Configuration', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have valid threshold values', () => {
      expect(DEFAULT_CONFIG.threshold.trivial).toBeLessThan(DEFAULT_CONFIG.threshold.low);
      expect(DEFAULT_CONFIG.threshold.low).toBeLessThan(DEFAULT_CONFIG.threshold.medium);
      expect(DEFAULT_CONFIG.threshold.medium).toBeLessThan(DEFAULT_CONFIG.threshold.high);
      expect(DEFAULT_CONFIG.threshold.high).toBeLessThan(DEFAULT_CONFIG.threshold.critical);
    });

    it('should have default exclude patterns', () => {
      expect(DEFAULT_CONFIG.exclude).toContain('**/node_modules/**');
      expect(DEFAULT_CONFIG.exclude).toContain('**/.git/**');
      expect(DEFAULT_CONFIG.exclude).toContain('**/dist/**');
    });

    it('should have supported languages', () => {
      expect(DEFAULT_CONFIG.languages).toContain('typescript');
      expect(DEFAULT_CONFIG.languages).toContain('javascript');
      expect(DEFAULT_CONFIG.languages).toContain('python');
    });

    it('should have output configuration', () => {
      expect(DEFAULT_CONFIG.output.format).toBe('text');
      expect(DEFAULT_CONFIG.output.color).toBe(true);
    });

    it('should have git configuration', () => {
      expect(DEFAULT_CONFIG.git.followSymlinks).toBe(false);
      expect(DEFAULT_CONFIG.git.ignoreBinaryFiles).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should return empty errors for valid config', () => {
      const errors = validateConfig({
        threshold: {
          trivial: 0.5,
          low: 1.5,
          medium: 3.0,
          high: 5.0,
          critical: 6.0,
        },
        include: ['**/*.ts'],
        exclude: ['**/node_modules/**'],
        languages: ['typescript'],
      });

      expect(errors).toHaveLength(0);
    });

    it('should validate threshold ordering', () => {
      const errors = validateConfig({
        threshold: {
          trivial: 5.0,
          low: 1.5, // Less than trivial
          medium: 3.0,
          high: 5.0,
          critical: 6.0,
        },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('low'))).toBe(true);
    });

    it('should validate threshold values are non-negative', () => {
      const errors = validateConfig({
        threshold: {
          trivial: -1,
          low: 1.5,
          medium: 3.0,
          high: 5.0,
          critical: 6.0,
        },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('non-negative'))).toBe(true);
    });

    it('should validate include is an array', () => {
      const errors = validateConfig({
        include: 'not-an-array' as any,
      });

      expect(errors).toContain('include must be an array of strings');
    });

    it('should validate exclude is an array', () => {
      const errors = validateConfig({
        exclude: 'not-an-array' as any,
      });

      expect(errors).toContain('exclude must be an array of strings');
    });

    it('should validate languages is an array', () => {
      const errors = validateConfig({
        languages: 'typescript' as any,
      });

      expect(errors).toContain('languages must be an array of strings');
    });

    it('should return empty for empty config', () => {
      const errors = validateConfig({});
      expect(errors).toHaveLength(0);
    });
  });
});
