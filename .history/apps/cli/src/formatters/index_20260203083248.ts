/**
 * SED - Semantic Entropy Differencing
 * CLI Formatters Index
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  AnalysisFormatOptions,
  CompareFormatOptions,
  ReportData,
  ReportOptions,
  OutputFormat,
} from '../types.js';

import { formatAnalysisAsText, formatCompareAsText, formatError } from './text.js';
import { formatAnalysisAsJson, formatCompareAsJson } from './json.js';
import { generateHtmlReport } from './html.js';
import { generateMarkdownReport } from './markdown.js';

/**
 * Format analysis result
 */
export function formatAnalysisResult(options: AnalysisFormatOptions): string {
  switch (options.format) {
    case 'json':
      return formatAnalysisAsJson(options);
    case 'html':
      // HTML not fully supported for inline output, fallback to text
      return formatAnalysisAsText(options);
    case 'text':
    default:
      return formatAnalysisAsText(options);
  }
}

/**
 * Format compare result
 */
export function formatCompareResult(options: CompareFormatOptions): string {
  switch (options.format) {
    case 'json':
      return formatCompareAsJson(options);
    case 'text':
    default:
      return formatCompareAsText(options);
  }
}

/**
 * Format report
 */
export function formatReport(
  data: ReportData,
  format: string,
  options: ReportOptions
): string {
  switch (format) {
    case 'html':
      return generateHtmlReport(data, options);
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'markdown':
    default:
      return generateMarkdownReport(data, options);
  }
}

// Re-export individual formatters
export { formatError } from './text.js';
export { generateHtmlReport } from './html.js';
export { generateMarkdownReport } from './markdown.js';
