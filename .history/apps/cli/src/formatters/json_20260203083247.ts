/**
 * SED - Semantic Entropy Differencing
 * CLI JSON Formatter
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  AnalysisFormatOptions,
  CompareFormatOptions,
  ReportData,
} from '../types.js';

/**
 * Format analysis result as JSON
 */
export function formatAnalysisAsJson(options: AnalysisFormatOptions): string {
  const { from, to, results, stats, summaryOnly } = options;

  const output: Record<string, any> = {
    meta: {
      from,
      to,
      generatedAt: new Date().toISOString(),
    },
    stats: {
      ...stats,
      totalFiles: results.length,
      successfulAnalyses: results.filter(r => !('error' in r)).length,
      failedAnalyses: results.filter(r => 'error' in r).length,
    },
    summary: generateSummary(results),
  };

  if (!summaryOnly) {
    output.files = results.map(r => ({
      path: r.file,
      status: r.status,
      language: r.language,
      ...(r.analysis ? {
        classification: r.analysis.classification,
        metrics: r.analysis.metrics,
        changes: r.analysis.changes,
      } : {}),
      ...(r.error ? { error: r.error } : {}),
    }));
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Generate summary from results
 */
function generateSummary(results: any[]): Record<string, any> {
  const successful = results.filter(r => r.analysis);

  const classificationCounts: Record<string, number> = {
    trivial: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalEntropy = 0;

  for (const result of successful) {
    const classification = result.analysis.classification;
    classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
    totalEntropy += result.analysis.metrics.totalEntropy;
  }

  return {
    classifications: classificationCounts,
    totalEntropy,
    averageEntropy: successful.length > 0 ? totalEntropy / successful.length : 0,
    highestImpact: successful
      .sort((a, b) => b.analysis.metrics.totalEntropy - a.analysis.metrics.totalEntropy)
      .slice(0, 5)
      .map(r => ({
        file: r.file,
        entropy: r.analysis.metrics.totalEntropy,
        classification: r.analysis.classification,
      })),
  };
}

/**
 * Format compare result as JSON
 */
export function formatCompareAsJson(options: CompareFormatOptions): string {
  const { source, target, analysis } = options;

  const output = {
    meta: {
      source,
      target,
      generatedAt: new Date().toISOString(),
    },
    result: analysis ? {
      classification: analysis.classification,
      metrics: analysis.metrics,
      changes: analysis.changes,
    } : null,
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Format report data as JSON
 */
export function formatReportAsJson(data: ReportData): string {
  return JSON.stringify({
    ...data,
    generatedAt: data.generatedAt.toISOString(),
  }, null, 2);
}
