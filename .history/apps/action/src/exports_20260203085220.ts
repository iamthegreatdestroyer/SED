/**
 * SED - Semantic Entropy Differencing
 * GitHub Action Exports
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

export { runAction } from './action';
export { analyzeCommitRange } from './analyzer';
export { formatMarkdownReport, formatPRComment, formatCompactSummary } from './formatter';
export type {
  ActionInputs,
  ActionResult,
  AnalysisOptions,
  AnalysisResult,
  AnalysisSummary,
  ChangeInfo,
  FileAnalysis,
  FileMetrics,
} from './types';
