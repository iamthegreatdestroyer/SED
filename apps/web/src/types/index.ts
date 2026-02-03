/**
 * SED - Semantic Entropy Differencing
 * Web Dashboard Type Definitions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

export type Classification = 'trivial' | 'low' | 'medium' | 'high' | 'critical';

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged';

export interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  nodeType: string;
  name: string;
  startLine: number;
  endLine: number;
  entropy: number;
  description?: string;
}

export interface FileMetrics {
  additions: number;
  deletions: number;
  modifications: number;
}

export interface FileAnalysisResult {
  path: string;
  relativePath: string;
  status: FileStatus;
  language: string;
  classification: Classification;
  entropy: number;
  changes: FileChange[];
  metrics: FileMetrics;
}

export interface AnalysisSummary {
  totalFiles: number;
  totalEntropy: number;
  averageEntropy: number;
  classifications: Record<Classification, number>;
  highestImpact: string[];
}

export interface AnalysisStats {
  additions: number;
  deletions: number;
  filesChanged: number;
}

export interface AnalysisResult {
  from: string;
  to: string;
  timestamp: Date;
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  stats: AnalysisStats;
}

export interface AnalysisOptions {
  from?: string;
  to?: string;
  path?: string;
  include?: string[];
  exclude?: string[];
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  classificationColors: Record<Classification, string>;
}
