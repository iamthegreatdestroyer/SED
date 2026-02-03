/**
 * SED - Semantic Entropy Differencing
 * Build scripts for all packages and apps
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { execaCommand } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';

const ROOT = path.resolve(import.meta.dirname, '../..');

interface BuildOptions {
  filter?: string;
  parallel?: boolean;
  clean?: boolean;
  prod?: boolean;
}

async function buildPackages(options: BuildOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n📦 Building SED Packages\n'));

  if (options.clean) {
    await clean(['packages']);
  }

  const spinner = ora('Building packages...').start();

  try {
    const filter = options.filter
      ? `--filter=${options.filter}`
      : '--filter="./packages/*"';

    await execaCommand(`pnpm turbo run build ${filter}`, {
      stdio: options.parallel ? 'inherit' : 'pipe',
      shell: true,
    });

    spinner.succeed('Packages built successfully');
  } catch (error) {
    spinner.fail('Package build failed');
    throw error;
  }
}

async function buildApps(options: BuildOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 Building SED Apps\n'));

  if (options.clean) {
    await clean(['apps']);
  }

  const spinner = ora('Building apps...').start();

  try {
    const filter = options.filter
      ? `--filter=${options.filter}`
      : '--filter="./apps/*"';

    await execaCommand(`pnpm turbo run build ${filter}`, {
      stdio: options.parallel ? 'inherit' : 'pipe',
      shell: true,
    });

    spinner.succeed('Apps built successfully');
  } catch (error) {
    spinner.fail('App build failed');
    throw error;
  }
}

async function buildDocs(): Promise<void> {
  console.log(chalk.blue.bold('\n📚 Building Documentation\n'));

  const spinner = ora('Building docs...').start();

  try {
    await execaCommand('pnpm --filter docs build', {
      stdio: 'pipe',
      shell: true,
    });

    spinner.succeed('Documentation built successfully');
  } catch (error) {
    spinner.fail('Documentation build failed');
    throw error;
  }
}

async function buildAll(options: BuildOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n🔨 Building Everything\n'));

  const startTime = Date.now();

  if (options.clean) {
    await clean(['packages', 'apps', 'docs']);
  }

  const spinner = ora('Building all workspaces...').start();

  try {
    await execaCommand('pnpm turbo run build', {
      stdio: options.parallel ? 'inherit' : 'pipe',
      shell: true,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    spinner.succeed(`All builds completed in ${chalk.green(duration + 's')}`);
  } catch (error) {
    spinner.fail('Build failed');
    throw error;
  }
}

async function clean(dirs: string[] = ['packages', 'apps', 'docs']): Promise<void> {
  const spinner = ora('Cleaning build artifacts...').start();

  const cleanPaths = [
    'dist',
    '.turbo',
    'coverage',
    '*.tsbuildinfo',
  ];

  try {
    for (const dir of dirs) {
      const targetDir = path.join(ROOT, dir);
      
      if (await fs.pathExists(targetDir)) {
        const workspaces = await fs.readdir(targetDir);
        
        for (const workspace of workspaces) {
          for (const cleanPath of cleanPaths) {
            const fullPath = path.join(targetDir, workspace, cleanPath);
            if (await fs.pathExists(fullPath)) {
              await fs.remove(fullPath);
            }
          }
        }
      }
    }

    spinner.succeed('Build artifacts cleaned');
  } catch (error) {
    spinner.fail('Failed to clean artifacts');
    throw error;
  }
}

async function buildForProduction(): Promise<void> {
  console.log(chalk.blue.bold('\n🚢 Production Build\n'));

  const startTime = Date.now();

  // Clean first
  await clean(['packages', 'apps', 'docs']);

  // Type check
  const typeSpinner = ora('Running type checks...').start();
  try {
    await execaCommand('pnpm turbo run typecheck', { shell: true });
    typeSpinner.succeed('Type checks passed');
  } catch (error) {
    typeSpinner.fail('Type checks failed');
    throw error;
  }

  // Lint
  const lintSpinner = ora('Running lints...').start();
  try {
    await execaCommand('pnpm turbo run lint', { shell: true });
    lintSpinner.succeed('Lint passed');
  } catch (error) {
    lintSpinner.fail('Lint failed');
    throw error;
  }

  // Test
  const testSpinner = ora('Running tests...').start();
  try {
    await execaCommand('pnpm turbo run test', { shell: true });
    testSpinner.succeed('Tests passed');
  } catch (error) {
    testSpinner.fail('Tests failed');
    throw error;
  }

  // Build
  const buildSpinner = ora('Building for production...').start();
  try {
    await execaCommand('pnpm turbo run build', { shell: true });
    buildSpinner.succeed('Production build complete');
  } catch (error) {
    buildSpinner.fail('Build failed');
    throw error;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(chalk.green.bold(`\n✅ Production build completed in ${duration}s\n`));
}

// CLI
program
  .name('build')
  .description('SED build utilities')
  .version('0.1.0');

program
  .command('all')
  .description('Build all packages and apps')
  .option('-c, --clean', 'Clean before building')
  .option('-p, --parallel', 'Show parallel output')
  .action(buildAll);

program
  .command('packages')
  .description('Build packages only')
  .option('-f, --filter <name>', 'Filter to specific package')
  .option('-c, --clean', 'Clean before building')
  .action(buildPackages);

program
  .command('apps')
  .description('Build apps only')
  .option('-f, --filter <name>', 'Filter to specific app')
  .option('-c, --clean', 'Clean before building')
  .action(buildApps);

program
  .command('docs')
  .description('Build documentation')
  .action(buildDocs);

program
  .command('prod')
  .description('Full production build with tests')
  .action(buildForProduction);

program
  .command('clean')
  .description('Clean all build artifacts')
  .action(() => clean(['packages', 'apps', 'docs']));

program.parse();
