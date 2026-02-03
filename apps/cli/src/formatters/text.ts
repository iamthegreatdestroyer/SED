/**
 * SED - Semantic Entropy Differencing
 * CLI Text Formatter
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import type { AnalysisFormatOptions, CompareFormatOptions, FileAnalysisResult } from '../types.js';

/**
 * Classification colors
 */
const classificationColors: Record<string, (text: string) => string> = {
  trivial: chalk.gray,
  low: chalk.green,
  medium: chalk.yellow,
  high: chalk.red,
  critical: chalk.bgRed.white.bold,
};

/**
 * Status symbols
 */
const statusSymbols: Record<string, string> = {
  added: chalk.green('+'),
  deleted: chalk.red('-'),
  modified: chalk.yellow('~'),
  renamed: chalk.blue('→'),
  copied: chalk.cyan('⊕'),
};

/**
 * Format analysis result as text
 */
export function formatAnalysisAsText(options: AnalysisFormatOptions): string {
  const { from, to, results, stats, summaryOnly, showDetails } = options;
  let output = '';

  // Header
  output += chalk.bold(`\nAnalysis: ${chalk.cyan(from)} → ${chalk.cyan(to)}\n`);
  output += chalk.gray('─'.repeat(60)) + '\n\n';

  // Summary statistics
  output += formatSummaryStats(results, stats);

  if (summaryOnly) {
    return output;
  }

  // Classification distribution
  output += '\n' + formatClassificationDistribution(results);

  // File details
  if (showDetails) {
    output += '\n' + formatFileDetails(results);
  }

  return output;
}

/**
 * Format summary statistics
 */
function formatSummaryStats(
  results: FileAnalysisResult[],
  stats: { additions: number; deletions: number; filesChanged: number }
): string {
  const table = new Table({
    chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
  });

  const successful = results.filter((r) => !('error' in r));
  const failed = results.filter((r) => 'error' in r);

  const totalEntropy = successful.reduce(
    (sum, r) => sum + (r.analysis?.metrics.totalEntropy ?? 0),
    0
  );
  const avgEntropy = successful.length > 0 ? totalEntropy / successful.length : 0;

  table.push(
    [chalk.gray('Files Changed'), chalk.bold(String(stats.filesChanged))],
    [chalk.gray('Lines Added'), chalk.green(`+${stats.additions}`)],
    [chalk.gray('Lines Deleted'), chalk.red(`-${stats.deletions}`)],
    [chalk.gray('Successful Analyses'), chalk.green(String(successful.length))],
    [chalk.gray('Failed Analyses'), failed.length > 0 ? chalk.red(String(failed.length)) : '0'],
    [chalk.gray('Total Entropy'), chalk.yellow(totalEntropy.toFixed(3))],
    [chalk.gray('Average Entropy'), chalk.yellow(avgEntropy.toFixed(3))]
  );

  return chalk.bold('Summary\n') + table.toString();
}

/**
 * Format classification distribution
 */
function formatClassificationDistribution(results: FileAnalysisResult[]): string {
  const counts: Record<string, number> = {
    trivial: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const result of results) {
    if (result.analysis) {
      const classification = result.analysis.classification;
      counts[classification] = (counts[classification] || 0) + 1;
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return chalk.gray('No classifications available\n');
  }

  let output = chalk.bold('Classification Distribution\n');

  const maxCount = Math.max(...Object.values(counts));
  const barWidth = 30;

  for (const [classification, count] of Object.entries(counts)) {
    const percentage = (count / total) * 100;
    const barLength = Math.round((count / maxCount) * barWidth);
    const bar = '█'.repeat(barLength) + '░'.repeat(barWidth - barLength);
    const colorFn = classificationColors[classification] || chalk.white;

    output += `  ${colorFn(classification.padEnd(10))} ${bar} ${count} (${percentage.toFixed(1)}%)\n`;
  }

  return output;
}

/**
 * Format file details
 */
function formatFileDetails(results: FileAnalysisResult[]): string {
  if (results.length === 0) {
    return '';
  }

  let output = chalk.bold('File Details\n');

  const table = new Table({
    head: [
      chalk.gray('Status'),
      chalk.gray('File'),
      chalk.gray('Language'),
      chalk.gray('Entropy'),
      chalk.gray('Classification'),
    ],
    colWidths: [8, 40, 12, 10, 14],
    wordWrap: true,
  });

  // Sort by entropy (highest first)
  const sorted = [...results].sort((a, b) => {
    const entropyA = a.analysis?.metrics.totalEntropy ?? 0;
    const entropyB = b.analysis?.metrics.totalEntropy ?? 0;
    return entropyB - entropyA;
  });

  for (const result of sorted) {
    const status = statusSymbols[result.status] || result.status;
    const language = result.language || 'unknown';

    if ('error' in result && result.error) {
      table.push([status, result.file, language, chalk.red('Error'), chalk.red('Failed')]);
    } else if (result.analysis) {
      const entropy = result.analysis.metrics.totalEntropy.toFixed(3);
      const classification = result.analysis.classification;
      const colorFn = classificationColors[classification] || chalk.white;

      table.push([status, result.file, language, entropy, colorFn(classification)]);
    }
  }

  output += table.toString();
  return output;
}

/**
 * Format compare result as text
 */
export function formatCompareAsText(options: CompareFormatOptions): string {
  const { source, target, analysis, showSemantic } = options;
  let output = '';

  output += chalk.bold(`\nComparing:\n`);
  output += `  ${chalk.cyan(source)}\n`;
  output += `  ${chalk.cyan(target)}\n`;
  output += chalk.gray('─'.repeat(60)) + '\n\n';

  if (analysis) {
    const classification = analysis.classification;
    const colorFn = classificationColors[classification] || chalk.white;

    output += `Classification: ${colorFn(classification)}\n`;
    output += `Total Entropy: ${chalk.yellow(analysis.metrics.totalEntropy.toFixed(3))}\n\n`;

    if (showSemantic && analysis.changes) {
      output += chalk.bold('Semantic Changes:\n');

      const table = new Table({
        head: [chalk.gray('Type'), chalk.gray('Node'), chalk.gray('Entropy')],
      });

      for (const change of analysis.changes) {
        table.push([change.type, change.nodeType, change.entropy.toFixed(3)]);
      }

      output += table.toString();
    }
  }

  return output;
}

/**
 * Format error for display
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    const stack = process.env.DEBUG ? `\n${error.stack}` : '';
    return chalk.red(`Error: ${error.message}${stack}`);
  }
  return chalk.red(`Error: ${String(error)}`);
}
