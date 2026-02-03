/**
 * SED - Semantic Entropy Differencing
 * CLI Type Definitions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

/**
 * SED Configuration
 */
export interface SEDConfig {
  threshold: ThresholdConfig;
  include: string[];
  exclude: string[];
  languages: string[];
  output: OutputConfig;
  git: GitConfig;
}

/**
 * Entropy threshold configuration
 */
export interface ThresholdConfig {
  trivial: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

/**
 * Output configuration
 */
export interface OutputConfig {
  format: OutputFormat;
  color: boolean;
}

/**
 * Git configuration
 */
export interface GitConfig {
  followSymlinks: boolean;
  ignoreBinaryFiles: boolean;
}

/**
 * Output formats
 */
export type OutputFormat = 'text' | 'json' | 'html';

/**
 * Report formats
 */
export type ReportFormat = 'html' | 'json' | 'markdown';

/**
 * Analyze command options
 */
export interface AnalyzeOptions {
  format?: string;
  output?: string;
  include?: string[];
  exclude?: string[];
  threshold?: string;
  details?: boolean;
  summaryOnly?: boolean;
}

/**
 * Compare command options
 */
export interface CompareOptions {
  format?: string;
  ref?: string;
  semantic?: boolean;
  diff?: boolean;
}

/**
 * Report command options
 */
export interface ReportOptions {
  format?: string;
  output?: string;
  changelog?: boolean;
  includeHunks?: boolean;
  metricsOnly?: boolean;
  title?: string;
}

/**
 * File analysis result
 */
export interface FileAnalysisResult {
  file: string;
  status: string;
  language?: string;
  analysis?: {
    classification: string;
    metrics: {
      totalEntropy: number;
      additions: number;
      deletions: number;
      modifications: number;
    };
    changes: Array<{
      type: string;
      nodeType: string;
      entropy: number;
    }>;
  };
  error?: string;
}

/**
 * Analysis result formatting options
 */
export interface AnalysisFormatOptions {
  from: string;
  to: string;
  results: FileAnalysisResult[];
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
  format: OutputFormat;
  summaryOnly?: boolean;
  showDetails?: boolean;
}

/**
 * Compare result formatting options
 */
export interface CompareFormatOptions {
  source: string;
  target: string;
  analysis: any;
  format: OutputFormat;
  showSemantic?: boolean;
  showDiff?: boolean;
}

/**
 * Report data structure
 */
export interface ReportData {
  title: string;
  from: string;
  to: string;
  generatedAt: Date;
  repository: {
    root: string;
    branch: string;
    commit: string;
    isClean: boolean;
  };
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
    totalCommits: number;
    conventionalCommits: number;
    breakingChanges: number;
  };
  files: FileAnalysisResult[];
  commits: Array<{
    hash: string;
    message: string;
    author: string;
    date: Date;
    isConventional: boolean;
  }>;
  changelog?: string;
  summary: {
    totalFiles: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    classifications: Record<string, number>;
    averageEntropy: number;
    totalEntropy: number;
    changes: {
      additions: number;
      deletions: number;
      modifications: number;
    };
    highestImpact: Array<{
      file: string;
      entropy: number;
      classification: string;
    }>;
  };
}
