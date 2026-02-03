/**
 * SED - Semantic Entropy Differencing
 * CLI Report Command
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import { loadConfig } from '../config/loader.js';
import {
  formatReport,
  formatError,
  generateHtmlReport,
  generateMarkdownReport,
} from '../formatters/index.js';
import type { ReportOptions, ReportFormat } from '../types.js';

/**
 * Create the report command
 */
export function createReportCommand(): Command {
  const command = new Command('report');

  command
    .description('Generate comprehensive analysis reports')
    .argument('<from>', 'Starting reference (commit, tag, branch)')
    .argument('[to]', 'Ending reference (defaults to HEAD)', 'HEAD')
    .addOption(
      new Option('-f, --format <format>', 'Report format')
        .choices(['html', 'json', 'markdown'])
        .default('markdown')
    )
    .option('-o, --output <file>', 'Output file path')
    .option('--changelog', 'Include auto-generated changelog')
    .option('--include-hunks', 'Include detailed hunk-level analysis')
    .option('--metrics-only', 'Include only metrics (no visualizations)')
    .option('--title <title>', 'Report title')
    .action(async (from: string, to: string, options: ReportOptions) => {
      await runReport(from, to, options);
    });

  return command;
}

/**
 * Run the report command
 */
async function runReport(from: string, to: string, options: ReportOptions): Promise<void> {
  const spinner = ora({
    text: `Generating report from ${chalk.cyan(from)} to ${chalk.cyan(to)}...`,
    color: 'blue',
  }).start();

  try {
    const cwd = (options as any).cwd || process.cwd();
    const config = await loadConfig(cwd);

    // Import dependencies
    const { SEDEngine } = await import('@sed/core');
    const { GitClient, DiffExtractor, CommitParser, RepoAnalyzer } = await import('@sed/git');

    // Initialize components
    const git = new GitClient(cwd);
    const isRepo = await git.isRepo();

    if (!isRepo) {
      spinner.fail('Not a Git repository');
      process.exit(3);
    }

    const diffExtractor = new DiffExtractor(git, {
      includePatterns: config.include,
      excludePatterns: config.exclude,
    });
    const commitParser = new CommitParser(git);
    const repoAnalyzer = new RepoAnalyzer(git);
    const engine = new SEDEngine({
      thresholds: config.threshold,
    });

    // Gather data
    spinner.text = 'Extracting changes...';
    const diff = await diffExtractor.extractDiff(from, to);

    spinner.text = 'Analyzing repository...';
    const repoInfo = await repoAnalyzer.analyze();

    spinner.text = 'Parsing commits...';
    const commitRange = await commitParser.parseRange(from, to);

    spinner.text = `Analyzing ${diff.files.length} files...`;
    const fileAnalyses = await Promise.all(
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
            hunks: options.includeHunks ? file.hunks : undefined,
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

    // Generate changelog if requested
    let changelog: string | undefined;
    if (options.changelog) {
      spinner.text = 'Generating changelog...';
      changelog = await commitParser.generateChangelog(from, to, { grouped: true });
    }

    spinner.text = 'Generating report...';

    // Build report data
    const reportData = {
      title: options.title || `SED Report: ${from}...${to}`,
      from,
      to,
      generatedAt: new Date(),
      repository: {
        root: repoInfo.root,
        branch: repoInfo.currentBranch,
        commit: repoInfo.currentCommit,
        isClean: repoInfo.isClean,
      },
      stats: {
        ...diff.stats,
        totalCommits: commitRange.totalCommits,
        conventionalCommits: commitRange.commits.filter((c) => c.isConventional).length,
        breakingChanges: commitRange.commits.filter(
          (c) => c.isConventional && c.conventional?.breaking
        ).length,
      },
      files: fileAnalyses,
      commits: commitRange.commits,
      changelog,
      summary: generateSummary(fileAnalyses),
    };

    // Format report
    const format = (options.format as ReportFormat) || 'markdown';
    let output: string;

    switch (format) {
      case 'html':
        output = generateHtmlReport(reportData, options);
        break;
      case 'json':
        output = JSON.stringify(reportData, null, 2);
        break;
      case 'markdown':
      default:
        output = generateMarkdownReport(reportData, options);
        break;
    }

    spinner.succeed('Report generated');

    // Write output
    if (options.output) {
      const outputPath = resolve(cwd, options.output);
      await writeFile(outputPath, output, 'utf-8');
      console.log(`\nReport written to: ${chalk.green(outputPath)}`);
    } else {
      console.log('\n' + output);
    }
  } catch (error) {
    spinner.fail('Report generation failed');
    console.error(formatError(error));
    process.exit(1);
  }
}

/**
 * Generate summary statistics
 */
function generateSummary(
  analyses: Array<{ file: string; status: string; analysis?: any; error?: string }>
): Record<string, any> {
  const successful = analyses.filter((a) => !('error' in a));
  const failed = analyses.filter((a) => 'error' in a);

  const classificationCounts: Record<string, number> = {
    trivial: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalEntropy = 0;
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalModifications = 0;

  for (const analysis of successful) {
    if (analysis.analysis) {
      const classification = analysis.analysis.classification;
      classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      totalEntropy += analysis.analysis.metrics.totalEntropy;
      totalAdditions += analysis.analysis.metrics.additions;
      totalDeletions += analysis.analysis.metrics.deletions;
      totalModifications += analysis.analysis.metrics.modifications;
    }
  }

  return {
    totalFiles: analyses.length,
    successfulAnalyses: successful.length,
    failedAnalyses: failed.length,
    classifications: classificationCounts,
    averageEntropy: successful.length > 0 ? totalEntropy / successful.length : 0,
    totalEntropy,
    changes: {
      additions: totalAdditions,
      deletions: totalDeletions,
      modifications: totalModifications,
    },
    highestImpact: successful
      .filter((a) => a.analysis)
      .sort((a, b) => b.analysis.metrics.totalEntropy - a.analysis.metrics.totalEntropy)
      .slice(0, 5)
      .map((a) => ({
        file: a.file,
        entropy: a.analysis.metrics.totalEntropy,
        classification: a.analysis.classification,
      })),
  };
}
