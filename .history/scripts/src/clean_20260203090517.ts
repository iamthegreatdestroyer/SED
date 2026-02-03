/**
 * SED - Semantic Entropy Differencing
 * Cleanup utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'fast-glob';

const ROOT = path.resolve(import.meta.dirname, '../..');

interface CleanOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

const CLEAN_PATTERNS = {
  build: ['**/dist', '**/.turbo', '**/*.tsbuildinfo'],
  cache: ['**/node_modules/.cache', '**/.turbo', '**/.next', '**/.vite'],
  coverage: ['**/coverage', '**/.nyc_output'],
  test: ['**/__snapshots__', '**/test-results'],
  deps: ['**/node_modules'],
  all: [] as string[], // Populated from all others
};

// Combine all patterns
CLEAN_PATTERNS.all = [
  ...CLEAN_PATTERNS.build,
  ...CLEAN_PATTERNS.cache,
  ...CLEAN_PATTERNS.coverage,
  ...CLEAN_PATTERNS.test,
];

async function cleanByPatterns(
  patterns: string[],
  options: CleanOptions = {}
): Promise<void> {
  const spinner = ora('Finding files to clean...').start();

  try {
    const files = await glob(patterns, {
      cwd: ROOT,
      onlyDirectories: true,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });

    spinner.stop();

    if (files.length === 0) {
      console.log(chalk.yellow('No files to clean.'));
      return;
    }

    console.log(chalk.blue(`\nFound ${files.length} items to clean:\n`));

    if (options.verbose) {
      for (const file of files) {
        console.log(chalk.dim(`  ${path.relative(ROOT, file)}`));
      }
      console.log('');
    }

    if (options.dryRun) {
      console.log(chalk.yellow('Dry run - no files deleted.'));
      return;
    }

    const deleteSpinner = ora('Deleting files...').start();

    let deleted = 0;
    for (const file of files) {
      try {
        await fs.remove(file);
        deleted++;
      } catch {
        // Ignore errors for files that can't be deleted
      }
    }

    deleteSpinner.succeed(`Deleted ${deleted} items`);
  } catch (error) {
    spinner.fail('Failed to clean');
    throw error;
  }
}

async function cleanBuild(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🧹 Cleaning Build Artifacts\n'));
  await cleanByPatterns(CLEAN_PATTERNS.build, options);
}

async function cleanCache(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🗑️ Cleaning Caches\n'));
  await cleanByPatterns(CLEAN_PATTERNS.cache, options);
}

async function cleanCoverage(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('\n📊 Cleaning Coverage Reports\n'));
  await cleanByPatterns(CLEAN_PATTERNS.coverage, options);
}

async function cleanDeps(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('\n📦 Cleaning Dependencies\n'));
  console.log(chalk.yellow('Warning: This will delete all node_modules folders.\n'));
  await cleanByPatterns(CLEAN_PATTERNS.deps, options);
}

async function cleanAll(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🧹 Cleaning Everything\n'));
  await cleanByPatterns(CLEAN_PATTERNS.all, options);
}

async function reinstall(): Promise<void> {
  console.log(chalk.blue.bold('\n🔄 Reinstalling Dependencies\n'));

  const { execaCommand } = await import('execa');

  // Clean deps
  await cleanByPatterns(CLEAN_PATTERNS.deps, {});

  // Clean lock file
  const lockFile = path.join(ROOT, 'pnpm-lock.yaml');
  if (await fs.pathExists(lockFile)) {
    await fs.remove(lockFile);
    console.log(chalk.dim('Removed pnpm-lock.yaml'));
  }

  // Reinstall
  const spinner = ora('Installing dependencies...').start();

  try {
    await execaCommand('pnpm install', {
      cwd: ROOT,
      shell: true,
    });
    spinner.succeed('Dependencies reinstalled');
  } catch (error) {
    spinner.fail('Failed to reinstall');
    throw error;
  }
}

// CLI
program
  .name('clean')
  .description('SED cleanup utilities')
  .version('0.1.0');

program
  .command('build')
  .description('Clean build artifacts (dist, .turbo)')
  .option('-d, --dry-run', 'Show what would be deleted')
  .option('-v, --verbose', 'Show all files')
  .action(cleanBuild);

program
  .command('cache')
  .description('Clean caches')
  .option('-d, --dry-run', 'Show what would be deleted')
  .option('-v, --verbose', 'Show all files')
  .action(cleanCache);

program
  .command('coverage')
  .description('Clean coverage reports')
  .option('-d, --dry-run', 'Show what would be deleted')
  .option('-v, --verbose', 'Show all files')
  .action(cleanCoverage);

program
  .command('deps')
  .description('Clean node_modules')
  .option('-d, --dry-run', 'Show what would be deleted')
  .option('-v, --verbose', 'Show all files')
  .action(cleanDeps);

program
  .command('all')
  .description('Clean everything except node_modules')
  .option('-d, --dry-run', 'Show what would be deleted')
  .option('-v, --verbose', 'Show all files')
  .action(cleanAll);

program
  .command('reinstall')
  .description('Remove deps and reinstall from scratch')
  .action(reinstall);

program.parse();
