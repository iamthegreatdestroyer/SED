/**
 * SED - Semantic Entropy Differencing
 * CLI Compare Command
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, extname } from 'path';
import { readFile, stat } from 'fs/promises';
import { loadConfig } from '../config/loader.js';
import { formatCompareResult, formatError } from '../formatters/index.js';
import type { CompareOptions, OutputFormat } from '../types.js';

/**
 * Create the compare command
 */
export function createCompareCommand(): Command {
  const command = new Command('compare');

  command
    .description('Compare two files or directories for semantic similarity')
    .argument('<source>', 'Source file or directory')
    .argument('<target>', 'Target file or directory')
    .addOption(
      new Option('-f, --format <format>', 'Output format')
        .choices(['text', 'json'])
        .default('text')
    )
    .option('--ref <commit>', 'Compare target against a specific commit')
    .option('--semantic', 'Show semantic similarity metrics')
    .option('--diff', 'Show diff output')
    .action(async (source: string, target: string, options: CompareOptions) => {
      await runCompare(source, target, options);
    });

  return command;
}

/**
 * Run the compare command
 */
async function runCompare(
  source: string,
  target: string,
  options: CompareOptions
): Promise<void> {
  const spinner = ora({
    text: `Comparing ${chalk.cyan(source)} with ${chalk.cyan(target)}...`,
    color: 'blue',
  }).start();

  try {
    const cwd = (options as any).cwd || process.cwd();
    const config = await loadConfig(cwd);

    const sourcePath = resolve(cwd, source);
    const targetPath = resolve(cwd, target);

    // Check if comparing with git ref
    if (options.ref) {
      await compareWithRef(sourcePath, options.ref, options, spinner);
      return;
    }

    // Check if paths exist
    const [sourceStat, targetStat] = await Promise.all([
      stat(sourcePath).catch(() => null),
      stat(targetPath).catch(() => null),
    ]);

    if (!sourceStat) {
      spinner.fail(`Source not found: ${source}`);
      process.exit(5);
    }

    if (!targetStat) {
      spinner.fail(`Target not found: ${target}`);
      process.exit(5);
    }

    // Compare files
    if (sourceStat.isFile() && targetStat.isFile()) {
      await compareFiles(sourcePath, targetPath, options, spinner);
    } else if (sourceStat.isDirectory() && targetStat.isDirectory()) {
      spinner.fail('Directory comparison not yet implemented');
      process.exit(1);
    } else {
      spinner.fail('Cannot compare file with directory');
      process.exit(5);
    }
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(formatError(error));
    process.exit(1);
  }
}

/**
 * Compare two files
 */
async function compareFiles(
  sourcePath: string,
  targetPath: string,
  options: CompareOptions,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  const [sourceContent, targetContent] = await Promise.all([
    readFile(sourcePath, 'utf-8'),
    readFile(targetPath, 'utf-8'),
  ]);

  spinner.text = 'Analyzing semantic differences...';

  // Import SED engine
  const { SEDEngine } = await import('@sed/core');
  const engine = new SEDEngine();

  // Detect language from extension
  const language = detectLanguage(sourcePath);

  // Analyze
  const analysis = await engine.analyze({
    path: sourcePath,
    beforeContent: sourceContent,
    afterContent: targetContent,
    language,
  });

  spinner.succeed('Comparison complete');

  // Format and output
  const output = formatCompareResult({
    source: sourcePath,
    target: targetPath,
    analysis,
    format: (options.format as OutputFormat) || 'text',
    showSemantic: options.semantic,
    showDiff: options.diff,
  });

  console.log('\n' + output);
}

/**
 * Compare file with git ref
 */
async function compareWithRef(
  filePath: string,
  ref: string,
  options: CompareOptions,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  const { GitClient } = await import('@sed/git');

  const cwd = (options as any).cwd || process.cwd();
  const git = new GitClient(cwd);

  // Check if repo
  const isRepo = await git.isRepo();
  if (!isRepo) {
    spinner.fail('Not a Git repository');
    process.exit(3);
  }

  spinner.text = `Fetching ${filePath} at ${ref}...`;

  // Get relative path from repo root
  const root = await git.getRoot();
  const relativePath = filePath.replace(root + '/', '').replace(root + '\\', '');

  try {
    const [currentContent, refContent] = await Promise.all([
      readFile(filePath, 'utf-8'),
      git.getFileContent(relativePath, ref),
    ]);

    spinner.text = 'Analyzing semantic differences...';

    const { SEDEngine } = await import('@sed/core');
    const engine = new SEDEngine();

    const language = detectLanguage(filePath);

    const analysis = await engine.analyze({
      path: relativePath,
      beforeContent: refContent,
      afterContent: currentContent,
      language,
    });

    spinner.succeed(`Compared with ${ref}`);

    const output = formatCompareResult({
      source: `${relativePath}@${ref}`,
      target: relativePath,
      analysis,
      format: (options.format as OutputFormat) || 'text',
      showSemantic: options.semantic,
      showDiff: options.diff,
    });

    console.log('\n' + output);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      spinner.fail(`File not found at ref ${ref}`);
      process.exit(3);
    }
    throw error;
  }
}

/**
 * Detect language from file extension
 */
function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
  };

  return languageMap[ext] || 'unknown';
}
