/**
 * SED - Semantic Entropy Differencing
 * Configuration Service Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, mockVscode } from './setup.js';

// Import after mocking
const { ConfigurationService } = await import('../src/services/configurationService.js');

describe('ConfigurationService', () => {
  let service: InstanceType<typeof ConfigurationService>;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetMocks();
    mockGet = vi.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        autoAnalyze: true,
        showInlineDecorations: true,
        showGutterIcons: true,
        'threshold.trivial': 0.5,
        'threshold.low': 1.5,
        'threshold.medium': 3.0,
        'threshold.high': 5.0,
        'threshold.critical': 6.0,
        exclude: ['**/node_modules/**'],
        languages: ['typescript', 'javascript'],
        defaultRef: 'HEAD~1',
        reportFormat: 'html',
      };
      return values[key] ?? defaultValue;
    });
    mockVscode.workspace.getConfiguration = vi.fn(() => ({
      get: mockGet,
      update: vi.fn(),
    }));
    service = new ConfigurationService();
  });

  describe('get', () => {
    it('should return autoAnalyze setting', () => {
      expect(service.get('autoAnalyze')).toBe(true);
    });

    it('should return showInlineDecorations setting', () => {
      expect(service.get('showInlineDecorations')).toBe(true);
    });

    it('should return exclude patterns', () => {
      expect(service.get('exclude')).toEqual(['**/node_modules/**']);
    });
  });

  describe('getAll', () => {
    it('should return full configuration object', () => {
      const config = service.getAll();

      expect(config.autoAnalyze).toBe(true);
      expect(config.showInlineDecorations).toBe(true);
      expect(config.defaultRef).toBe('HEAD~1');
      expect(config.threshold.medium).toBe(3.0);
    });
  });

  describe('getThresholds', () => {
    it('should return threshold configuration', () => {
      const thresholds = service.getThresholds();

      expect(thresholds).toBeDefined();
    });
  });

  describe('reload', () => {
    it('should reload configuration from VS Code', () => {
      service.reload();

      expect(mockVscode.workspace.getConfiguration).toHaveBeenCalledWith('sed');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(service.isLanguageSupported('typescript')).toBe(true);
      expect(service.isLanguageSupported('javascript')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(service.isLanguageSupported('cobol')).toBe(false);
    });
  });
});
