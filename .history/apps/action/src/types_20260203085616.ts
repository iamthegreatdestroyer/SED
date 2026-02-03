/**
 * SED - Semantic Entropy Differencing
 * GitHub Action Type Definitions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

export interface ActionInputs {
  base: string;
  head: string;
  path: string;
  include: string;
  exclude: string;
  failOn: 'critical' | 'high' | 'medium' | 'low' | 'never';
  threshold: string;
  comment: boolean;
  jsonOutput: string;
  markdownOutput: string;
  summary: boolean;
}

export interface AnalysisOptions {
  from: string;
  to: string;
  path?: string;
  include?: string[];
  exclude?: string[];
}

export interface FileAnalysis {
  path: string;
  relativePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  language: string;
  classification: 'trivial' | 'low' | 'medium' | 'high' | 'critical';
  entropy: number;
  changes: ChangeInfo[];
  metrics: FileMetrics;
}

export interface ChangeInfo {
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

export interface AnalysisSummary {
  totalFiles: number;
  totalEntropy: number;
  averageEntropy: number;
  classifications: Record<string, number>;
  highestImpact: string[];
}

export interface AnalysisResult {
  from: string;
  to: string;
  timestamp: string;
  files: FileAnalysis[];
  summary: AnalysisSummary;
}

export interface ActionResult {
  analysis: AnalysisResult;
  summary: {
    totalEntropy: number;
    averageEntropy: number;
    totalFiles: number;
  };
  classification: 'trivial' | 'low' | 'medium' | 'high' | 'critical';
  shouldFail: boolean;
  failureMessage?: string;
}
