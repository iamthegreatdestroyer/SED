/**
 * SED - Semantic Entropy Differencing
 * Validation Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SEDConfig, SupportedLanguage } from '../types/index.js';

/**
 * Supported language extensions mapping
 */
export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, readonly string[]> = {
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py', '.pyw', '.pyi'],
  rust: ['.rs'],
  go: ['.go'],
  java: ['.java'],
  c: ['.c', '.h'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.h'],
  csharp: ['.cs'],
} as const;

/**
 * Detect language from file path
 */
export function detectLanguage(filePath: string): SupportedLanguage | null {
  const ext = getFileExtension(filePath);

  for (const [language, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return language as SupportedLanguage;
    }
  }

  return null;
}

/**
 * Get file extension (lowercase)
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filePath.slice(lastDot).toLowerCase();
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
  return language in LANGUAGE_EXTENSIONS;
}

/**
 * Validate probability distribution
 */
export function isValidProbabilityDistribution(probs: readonly number[]): boolean {
  if (probs.length === 0) return false;

  let sum = 0;
  for (const p of probs) {
    if (p < 0 || p > 1) return false;
    sum += p;
  }

  // Allow small floating-point error
  return Math.abs(sum - 1) < 1e-10;
}

/**
 * Validate entropy thresholds
 */
export function isValidEntropyThresholds(thresholds: {
  minimal: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}): boolean {
  return (
    thresholds.minimal >= 0 &&
    thresholds.minimal < thresholds.low &&
    thresholds.low < thresholds.moderate &&
    thresholds.moderate < thresholds.high &&
    thresholds.high < thresholds.critical &&
    thresholds.critical <= 1
  );
}

/**
 * Validate SED configuration
 */
export function validateConfig(config: unknown): config is SEDConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as Record<string, unknown>;

  // Check version
  if (c['version'] !== '1.0') return false;

  // Check required sections exist
  if (
    !c['output'] ||
    !c['entropy'] ||
    !c['diff'] ||
    !c['languages'] ||
    !c['git'] ||
    !c['performance']
  ) {
    return false;
  }

  return true;
}

/**
 * Configuration validation errors
 */
export interface ConfigValidationError {
  path: string;
  message: string;
}

/**
 * Validate configuration with detailed errors
 */
export function validateConfigDetailed(config: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({ path: '', message: 'Configuration must be an object' });
    return errors;
  }

  const c = config as Record<string, unknown>;

  if (c['version'] !== '1.0') {
    errors.push({ path: 'version', message: 'Version must be "1.0"' });
  }

  if (!c['output']) {
    errors.push({ path: 'output', message: 'Output configuration is required' });
  }

  if (!c['entropy']) {
    errors.push({ path: 'entropy', message: 'Entropy configuration is required' });
  } else {
    const entropy = c['entropy'] as Record<string, unknown>;
    if (entropy['thresholds']) {
      const thresholds = entropy['thresholds'] as Record<string, unknown>;
      if (!isValidEntropyThresholds(thresholds as any)) {
        errors.push({
          path: 'entropy.thresholds',
          message: 'Thresholds must be ascending: minimal < low < moderate < high < critical',
        });
      }
    }
  }

  if (!c['diff']) {
    errors.push({ path: 'diff', message: 'Diff configuration is required' });
  }

  if (!c['languages']) {
    errors.push({ path: 'languages', message: 'Languages configuration is required' });
  } else {
    const languages = c['languages'] as Record<string, unknown>;
    if (Array.isArray(languages['enabled'])) {
      for (const lang of languages['enabled']) {
        if (!isLanguageSupported(lang as string)) {
          errors.push({
            path: 'languages.enabled',
            message: `Unsupported language: ${lang}`,
          });
        }
      }
    }
  }

  if (!c['git']) {
    errors.push({ path: 'git', message: 'Git configuration is required' });
  }

  if (!c['performance']) {
    errors.push({ path: 'performance', message: 'Performance configuration is required' });
  }

  return errors;
}

/**
 * Assert condition and throw if false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Assert value is defined
 */
export function assertDefined<T>(value: T | undefined | null, name: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required but was ${value}`);
  }
}
