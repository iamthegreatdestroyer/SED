/**
 * SED - Semantic Entropy Differencing
 * CLI Analyze Command
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import { loadConfig } from '../config/loader.js';
import { formatAnalysisResult, formatError } from '../formatters/index.js';
import type { AnalyzeOptions, OutputFormat } from '../types.js';

/**
 * Create the analyze command
 */
export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Analyze changes between two Git references using semantic entropy')
    .argument('<from>', 'Starting reference (commit, tag, branch)')
    .argument('[to]', 'Ending reference (defaults to HEAD)', 'HEAD')
    .addOption(
      new Option('-f, --format <format>', 'Output format')
        .choices(['text', 'json', 'html'])
        .default('text')
    )
    .option('-o, --output <file>', 'Write output to file')
    .option('--include <patterns...>', 'Include file patterns (glob)')
    .option('--exclude <patterns...>', 'Exclude file patterns (glob)')
    .addOption(
      new Option('--threshold <level>', 'Minimum entropy level to report').choices([
        'trivial',
        'low',
        'medium',
        'high',
        'critical',
      ])
    )
    .option('--no-details', 'Hide detailed analysis')
    .option('--summary-only', 'Show only summary statistics')
    .action(async (from: string, to: string, options: AnalyzeOptions) => {
      await runAnalyze(from, to, options);
    });

  return command;
}

/**
 * Run the analyze command
 */
async function runAnalyze(from: string, to: string, options: AnalyzeOptions): Promise<void> {
  const spinner = ora({
    text: `Analyzing changes from ${chalk.cyan(from)} to ${chalk.cyan(to)}...`,
    color: 'blue',
  }).start();

  try {
    // Load configuration
    const cwd = (options as any).cwd || process.cwd();
    const config = await loadConfig(cwd);

    // Merge config with command options
    const includePatterns = options.include ?? config.include ?? [];
    const excludePatterns = options.exclude ?? config.exclude ?? [];

    // Import SED engine (dynamic to allow tree-shaking)
    const { SEDEngine } = await import('@sed/core');
    const { GitClient, DiffExtractor } = await import('@sed/git');

    // Initialize components
    const git = new GitClient(cwd);
    const isRepo = await git.isRepo();

    if (!isRepo) {
      spinner.fail('Not a Git repository');
      process.exit(3);
    }

    const diffExtractor = new DiffExtractor(git, {
      includePatterns,
      excludePatterns,
    });

    const engine = new SEDEngine({
      thresholds: config.threshold,
    });

    // Extract diff
    spinner.text = 'Extracting changes...';
    const diff = await diffExtractor.extractDiff(from, to);

    if (diff.files.length === 0) {
      spinner.info('No changes found between the specified references');
      return;
    }

    spinner.text = `Analyzing ${diff.files.length} changed files...`;

    // Analyze each file
    const results = await Promise.all(
      diff.files.map(async (file) => {
        try {
          const analysis = await engine.analyze({
            path: file.path,
            beforeContent: file.beforeContent ?? '',
            afterContent: file.afterContent ?? '',
            language: file.language,
          });

          return {
            file: file.path,
            status: file.status,
            language: file.language,
            analysis,
          };
        } catch (error) {
          return {
            file: file.path,
            status: file.status,
            language: file.language,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Filter by threshold if specified
    const filteredResults = options.threshold
      ? results.filter((r) => {
          if ('error' in r) return false;
          return meetsThreshold(r.analysis.classification, options.threshold!);
        })
      : results;

    spinner.succeed(
      `Analyzed ${chalk.green(diff.files.length)} files, ` +
        `${chalk.yellow(diff.stats.additions)} additions, ` +
        `${chalk.red(diff.stats.deletions)} deletions`
    );

    // Format output
    const format = (options.format as OutputFormat) || 'text';
    const output = formatAnalysisResult({
      from,
      to,
      results: filteredResults,
      stats: diff.stats,
      format,
      summaryOnly: options.summaryOnly,
      showDetails: options.details !== false,
    });

    // Write output
    if (options.output) {
      const outputPath = resolve(cwd, options.output);
      await writeFile(outputPath, output, 'utf-8');
      console.log(`\nReport written to: ${chalk.green(outputPath)}`);
    } else {
      console.log('\n' + output);
    }

    // Exit with appropriate code based on results
    const hasCritical = results.some(
      (r) => !('error' in r) && r.analysis.classification === 'critical'
    );
    if (hasCritical) {
      process.exit(4);
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(formatError(error));
    process.exit(1);
  }
}

/**
 * Check if classification meets threshold
 */
function meetsThreshold(classification: string, threshold: string): boolean {
  const levels = ['trivial', 'low', 'medium', 'high', 'critical'];
  const classIndex = levels.indexOf(classification);
  const thresholdIndex = levels.indexOf(threshold);
  return classIndex >= thresholdIndex;
}
