/**
 * SED - Semantic Entropy Differencing
 * Development server and watcher utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { execaCommand } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';

const WORKSPACES = {
  packages: ['@sed/shared', '@sed/config', '@sed/core', '@sed/git'],
  apps: ['@sed/cli', '@sed/vscode', '@sed/web', '@sed/action'],
  docs: ['docs'],
};

async function runDevServer(workspace: string): Promise<void> {
  const spinner = ora(`Starting ${chalk.cyan(workspace)} in dev mode...`).start();

  try {
    spinner.succeed(`Starting ${chalk.cyan(workspace)}`);

    await execaCommand(`pnpm --filter ${workspace} dev`, {
      stdio: 'inherit',
      shell: true,
    });
  } catch (error) {
    spinner.fail(`Failed to start ${workspace}`);
    throw error;
  }
}

async function runAllDev(): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 Starting SED Development Servers\n'));

  // Build dependencies first
  const spinner = ora('Building dependencies...').start();

  try {
    await execaCommand('pnpm turbo run build --filter=@sed/shared --filter=@sed/config', {
      shell: true,
    });
    spinner.succeed('Dependencies built');
  } catch (error) {
    spinner.fail('Failed to build dependencies');
    throw error;
  }

  // Start dev servers in parallel
  console.log(chalk.yellow('\nStarting dev servers...\n'));

  await execaCommand('pnpm turbo run dev --parallel', {
    stdio: 'inherit',
    shell: true,
  });
}

async function watchPackages(): Promise<void> {
  console.log(chalk.blue.bold('\n👀 Watching packages for changes\n'));

  await execaCommand('pnpm turbo run dev --filter="./packages/*" --parallel', {
    stdio: 'inherit',
    shell: true,
  });
}

async function watchApps(): Promise<void> {
  console.log(chalk.blue.bold('\n👀 Watching apps for changes\n'));

  await execaCommand('pnpm turbo run dev --filter="./apps/*" --parallel', {
    stdio: 'inherit',
    shell: true,
  });
}

// CLI
program.name('dev').description('SED development utilities').version('0.1.0');

program.command('all').description('Start all development servers').action(runAllDev);

program.command('packages').description('Watch packages for changes').action(watchPackages);

program.command('apps').description('Watch apps for changes').action(watchApps);

program
  .command('run <workspace>')
  .description('Run dev server for a specific workspace')
  .action(runDevServer);

program.parse();
