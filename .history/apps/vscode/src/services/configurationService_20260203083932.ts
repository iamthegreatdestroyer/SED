/**
 * SED - Semantic Entropy Differencing
 * Configuration Service
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';
import type { SEDConfiguration } from '../types.js';

/**
 * Service for managing extension configuration
 */
export class ConfigurationService {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('sed');
  }

  /**
   * Get a configuration value
   */
  get<K extends keyof SEDConfiguration>(key: K): SEDConfiguration[K] {
    return this.config.get(key) as SEDConfiguration[K];
  }

  /**
   * Get the full configuration
   */
  getAll(): SEDConfiguration {
    return {
      autoAnalyze: this.config.get('autoAnalyze', true),
      showInlineDecorations: this.config.get('showInlineDecorations', true),
      showGutterIcons: this.config.get('showGutterIcons', true),
      threshold: {
        trivial: this.config.get('threshold.trivial', 0.5),
        low: this.config.get('threshold.low', 1.5),
        medium: this.config.get('threshold.medium', 3.0),
        high: this.config.get('threshold.high', 5.0),
        critical: this.config.get('threshold.critical', 6.0),
      },
      exclude: this.config.get('exclude', [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
      ]),
      languages: this.config.get('languages', [
        'typescript',
        'javascript',
        'python',
        'java',
        'go',
        'rust',
      ]),
      defaultRef: this.config.get('defaultRef', 'HEAD~1'),
      reportFormat: this.config.get('reportFormat', 'html'),
    };
  }

  /**
   * Update a configuration value
   */
  async set<K extends keyof SEDConfiguration>(
    key: K,
    value: SEDConfiguration[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace,
  ): Promise<void> {
    await this.config.update(key, value, target);
  }

  /**
   * Reload configuration from VS Code settings
   */
  reload(): void {
    this.config = vscode.workspace.getConfiguration('sed');
  }

  /**
   * Get thresholds for entropy classification
   */
  getThresholds(): SEDConfiguration['threshold'] {
    return this.get('threshold');
  }

  /**
   * Check if a file should be excluded
   */
  shouldExclude(filePath: string): boolean {
    const patterns = this.get('exclude');
    const { minimatch } = require('minimatch');
    
    return patterns.some((pattern: string) => minimatch(filePath, pattern));
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.get('languages').includes(language);
  }
}
