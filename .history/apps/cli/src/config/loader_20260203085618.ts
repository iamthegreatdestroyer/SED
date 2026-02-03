/**
 * SED - Semantic Entropy Differencing
 * CLI Configuration Loader
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { cosmiconfig } from 'cosmiconfig';
import { resolve } from 'path';
import type { SEDConfig } from '../types.js';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: SEDConfig = {
  threshold: {
    trivial: 0.5,
    low: 1.5,
    medium: 3.0,
    high: 5.0,
    critical: 6.0,
  },
  include: [],
  exclude: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/*.min.js',
    '**/*.bundle.js',
    '**/vendor/**',
    '**/*.lock',
    '**/package-lock.json',
    '**/pnpm-lock.yaml',
    '**/yarn.lock',
  ],
  languages: ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp'],
  output: {
    format: 'text',
    color: true,
  },
  git: {
    followSymlinks: false,
    ignoreBinaryFiles: true,
  },
};

/**
 * Configuration explorer
 */
const explorer = cosmiconfig('sed', {
  searchPlaces: [
    'package.json',
    '.sedrc',
    '.sedrc.json',
    '.sedrc.yaml',
    '.sedrc.yml',
    '.sedrc.js',
    '.sedrc.cjs',
    '.sedrc.mjs',
    'sed.config.js',
    'sed.config.cjs',
    'sed.config.mjs',
  ],
  packageProp: 'sed',
});

/**
 * Load configuration from workspace
 */
export async function loadConfig(cwd: string): Promise<SEDConfig> {
  try {
    const result = await explorer.search(cwd);

    if (result && result.config) {
      return mergeConfig(DEFAULT_CONFIG, result.config);
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    // Return default on error
    console.warn('Warning: Failed to load configuration, using defaults');
    return DEFAULT_CONFIG;
  }
}

/**
 * Load configuration from a specific file
 */
export async function loadConfigFile(filepath: string): Promise<SEDConfig> {
  try {
    const result = await explorer.load(filepath);

    if (result && result.config) {
      return mergeConfig(DEFAULT_CONFIG, result.config);
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    throw new Error(`Failed to load configuration from ${filepath}: ${error}`);
  }
}

/**
 * Find configuration file
 */
export async function findConfigFile(cwd: string): Promise<string | null> {
  try {
    const result = await explorer.search(cwd);
    return result?.filepath ?? null;
  } catch {
    return null;
  }
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(defaults: SEDConfig, overrides: Partial<SEDConfig>): SEDConfig {
  const result: SEDConfig = { ...defaults };

  if (overrides.threshold) {
    result.threshold = { ...defaults.threshold, ...overrides.threshold };
  }

  if (overrides.include) {
    result.include = overrides.include;
  }

  if (overrides.exclude) {
    result.exclude = [...defaults.exclude, ...overrides.exclude];
  }

  if (overrides.languages) {
    result.languages = overrides.languages;
  }

  if (overrides.output) {
    result.output = { ...defaults.output, ...overrides.output };
  }

  if (overrides.git) {
    result.git = { ...defaults.git, ...overrides.git };
  }

  return result;
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<SEDConfig>): string[] {
  const errors: string[] = [];

  if (config.threshold) {
    const thresholds = config.threshold;
    const levels = ['trivial', 'low', 'medium', 'high', 'critical'] as const;

    let prevValue = 0;
    for (const level of levels) {
      const value = thresholds[level];
      if (value !== undefined) {
        if (typeof value !== 'number' || value < 0) {
          errors.push(`threshold.${level} must be a non-negative number`);
        } else if (value < prevValue) {
          errors.push(`threshold.${level} must be greater than previous threshold`);
        }
        prevValue = value;
      }
    }
  }

  if (config.include && !Array.isArray(config.include)) {
    errors.push('include must be an array of strings');
  }

  if (config.exclude && !Array.isArray(config.exclude)) {
    errors.push('exclude must be an array of strings');
  }

  if (config.languages && !Array.isArray(config.languages)) {
    errors.push('languages must be an array of strings');
  }

  return errors;
}
