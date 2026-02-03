/**
 * SED - Semantic Entropy Differencing
 * Configuration Types
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { EntropyThresholds } from './entropy.js';
import type { DiffOptions, DiffOutputFormat } from './diff.js';
import type { SupportedLanguage } from './semantic.js';

/**
 * SED Configuration
 */
export interface SEDConfig {
  /**
   * Version of the configuration schema
   */
  readonly version: '1.0';

  /**
   * Output configuration
   */
  readonly output: OutputConfig;

  /**
   * Entropy calculation settings
   */
  readonly entropy: EntropyConfig;

  /**
   * Diff computation settings
   */
  readonly diff: DiffConfig;

  /**
   * Language-specific settings
   */
  readonly languages: LanguageConfig;

  /**
   * Git integration settings
   */
  readonly git: GitConfig;

  /**
   * Performance settings
   */
  readonly performance: PerformanceConfig;
}

/**
 * Output configuration
 */
export interface OutputConfig {
  readonly format: DiffOutputFormat;
  readonly colorize: boolean;
  readonly showEntropy: boolean;
  readonly showStats: boolean;
  readonly groupByFile: boolean;
  readonly maxLines?: number;
}

/**
 * Entropy configuration
 */
export interface EntropyConfig {
  readonly enabled: boolean;
  readonly thresholds: EntropyThresholds;
  readonly highlightHotspots: boolean;
  readonly propagationAnalysis: boolean;
  readonly semanticWeight: number;      // 0-1, weight of semantic vs structural
  readonly structuralWeight: number;    // 0-1, weight of structural vs semantic
}

/**
 * Diff configuration
 */
export interface DiffConfig extends DiffOptions {
  readonly algorithm: 'sed-v1';
  readonly contextLines: number;
}

/**
 * Language-specific configuration
 */
export interface LanguageConfig {
  readonly enabled: readonly SupportedLanguage[];
  readonly parserOptions: Partial<Record<SupportedLanguage, ParserOptions>>;
}

/**
 * Parser options per language
 */
export interface ParserOptions {
  readonly maxFileSize?: number;
  readonly timeout?: number;
  readonly includeComments?: boolean;
  readonly customPatterns?: readonly string[];
}

/**
 * Git integration configuration
 */
export interface GitConfig {
  readonly enabled: boolean;
  readonly driver: 'auto' | 'manual';
  readonly attributes: readonly string[];
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  readonly parallel: boolean;
  readonly maxConcurrency: number;
  readonly cacheEnabled: boolean;
  readonly cachePath?: string;
  readonly timeout: number;
}

/**
 * Default SED configuration
 */
export const DEFAULT_SED_CONFIG: SEDConfig = {
  version: '1.0',
  output: {
    format: 'text',
    colorize: true,
    showEntropy: true,
    showStats: true,
    groupByFile: true,
  },
  entropy: {
    enabled: true,
    thresholds: {
      minimal: 0.1,
      low: 0.3,
      moderate: 0.6,
      high: 0.8,
      critical: 1.0,
    },
    highlightHotspots: true,
    propagationAnalysis: true,
    semanticWeight: 0.6,
    structuralWeight: 0.4,
  },
  diff: {
    algorithm: 'sed-v1',
    includeComments: true,
    includeWhitespace: false,
    maxDepth: Infinity,
    entropyThreshold: 0,
    groupBySemanticUnit: true,
    detectMoves: true,
    detectRenames: true,
    contextLines: 3,
  },
  languages: {
    enabled: ['typescript', 'javascript', 'python', 'rust', 'go', 'java'],
    parserOptions: {},
  },
  git: {
    enabled: true,
    driver: 'auto',
    attributes: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.py', '*.rs', '*.go', '*.java'],
  },
  performance: {
    parallel: true,
    maxConcurrency: 4,
    cacheEnabled: true,
    timeout: 30000,
  },
} as const;

/**
 * Configuration file name
 */
export const CONFIG_FILE_NAME = 'sed.config.json';

/**
 * Configuration schema version
 */
export const CONFIG_SCHEMA_VERSION = '1.0';
