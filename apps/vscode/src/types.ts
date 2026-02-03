/**
 * SED - Semantic Entropy Differencing
 * VS Code Extension Types
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

/**
 * Classification levels for semantic entropy
 */
export type Classification = 'trivial' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Analysis result for a single file
 */
export interface FileAnalysisResult {
  path: string;
  relativePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  language: string;
  classification: Classification;
  entropy: number;
  changes: ChangeDetail[];
  metrics: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

/**
 * Detail of a single change
 */
export interface ChangeDetail {
  type: 'added' | 'modified' | 'deleted';
  nodeType: string;
  name?: string;
  startLine: number;
  endLine: number;
  entropy: number;
  description?: string;
}

/**
 * Summary of analysis results
 */
export interface AnalysisSummary {
  totalFiles: number;
  totalEntropy: number;
  averageEntropy: number;
  classifications: Record<Classification, number>;
  highestImpact: FileAnalysisResult[];
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  from: string;
  to: string;
  timestamp: Date;
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
}

/**
 * History entry for past analyses
 */
export interface HistoryEntry {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  summary: AnalysisSummary;
}

/**
 * Extension configuration
 */
export interface SEDConfiguration {
  autoAnalyze: boolean;
  showInlineDecorations: boolean;
  showGutterIcons: boolean;
  threshold: {
    trivial: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  exclude: string[];
  languages: string[];
  defaultRef: string;
  reportFormat: 'html' | 'markdown' | 'json';
}

/**
 * Tree item data for the explorer view
 */
export interface TreeItemData {
  type: 'file' | 'change' | 'summary' | 'statistic' | 'history';
  label: string;
  description?: string;
  tooltip?: string;
  classification?: Classification;
  entropy?: number;
  path?: string;
  collapsible: boolean;
  children?: TreeItemData[];
  contextValue?: string;
}

/**
 * Report options
 */
export interface ReportOptions {
  format: 'html' | 'markdown' | 'json';
  title?: string;
  includeChanges: boolean;
  includeCommits: boolean;
  outputPath?: string;
}

/**
 * Service dependencies for command registration
 */
export interface ServiceDependencies {
  analysisService: import('./services/analysisService.js').AnalysisService;
  decorationManager: import('./decorations/decorationManager.js').DecorationManager;
  configService: import('./services/configurationService.js').ConfigurationService;
  statusBarManager: import('./ui/statusBar.js').StatusBarManager;
  changesProvider: import('./views/treeDataProvider.js').SEDTreeDataProvider;
  summaryProvider: import('./views/treeDataProvider.js').SEDTreeDataProvider;
  historyProvider: import('./views/treeDataProvider.js').SEDTreeDataProvider;
  logger: import('./utils/logger.js').OutputChannelLogger;
}
