/**
 * SED - Semantic Entropy Differencing
 * CLI Info Command
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { metadata } from '../version.js';
import { formatError } from '../formatters/index.js';

/**
 * Create the info command
 */
export function createInfoCommand(): Command {
  const command = new Command('info');

  command
    .description('Show repository and SED information')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await showInfo(options);
    });

  return command;
}

/**
 * Show information
 */
async function showInfo(options: { json?: boolean }): Promise<void> {
  const cwd = process.cwd();

  try {
    // Check if in a git repo
    const { GitClient, RepoAnalyzer } = await import('@sed/git');
    const git = new GitClient(cwd);
    const isRepo = await git.isRepo();

    let repoInfo: Record<string, any> | null = null;

    if (isRepo) {
      const analyzer = new RepoAnalyzer(git);
      const info = await analyzer.analyze();

      repoInfo = {
        root: info.root,
        branch: info.currentBranch,
        commit: info.currentCommit,
        clean: info.isClean,
        stats: {
          commits: info.stats.totalCommits,
          branches: info.stats.totalBranches,
          tags: info.stats.totalTags,
          contributors: info.stats.contributors,
          files: info.stats.filesTracked,
        },
      };
    }

    const infoData = {
      sed: {
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        license: metadata.license,
        repository: metadata.repository,
      },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: cwd,
      },
      repository: repoInfo,
    };

    if (options.json) {
      console.log(JSON.stringify(infoData, null, 2));
      return;
    }

    // Display formatted info
    console.log();
    console.log(chalk.bold.blue('╭─────────────────────────────────────────╮'));
    console.log(chalk.bold.blue('│   SED - Semantic Entropy Differencing   │'));
    console.log(chalk.bold.blue('╰─────────────────────────────────────────╯'));
    console.log();

    // SED Info
    const sedTable = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });

    sedTable.push(
      [chalk.gray('Version'), chalk.green(metadata.version)],
      [chalk.gray('License'), metadata.license],
      [chalk.gray('Repository'), chalk.cyan(metadata.repository)],
    );

    console.log(chalk.bold('SED Information'));
    console.log(sedTable.toString());
    console.log();

    // Environment
    const envTable = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });

    envTable.push(
      [chalk.gray('Node.js'), process.version],
      [chalk.gray('Platform'), `${process.platform} (${process.arch})`],
      [chalk.gray('Working Directory'), cwd],
    );

    console.log(chalk.bold('Environment'));
    console.log(envTable.toString());
    console.log();

    // Repository Info
    if (repoInfo) {
      const repoTable = new Table({
        chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      });

      repoTable.push(
        [chalk.gray('Root'), repoInfo.root],
        [chalk.gray('Branch'), chalk.cyan(repoInfo.branch)],
        [chalk.gray('Commit'), chalk.yellow(repoInfo.commit.substring(0, 8))],
        [chalk.gray('Status'), repoInfo.clean ? chalk.green('Clean') : chalk.yellow('Modified')],
        [chalk.gray('Commits'), String(repoInfo.stats.commits)],
        [chalk.gray('Branches'), String(repoInfo.stats.branches)],
        [chalk.gray('Tags'), String(repoInfo.stats.tags)],
        [chalk.gray('Contributors'), String(repoInfo.stats.contributors)],
        [chalk.gray('Tracked Files'), String(repoInfo.stats.files)],
      );

      console.log(chalk.bold('Repository'));
      console.log(repoTable.toString());
    } else {
      console.log(chalk.yellow('Not in a Git repository'));
    }

    console.log();
  } catch (error) {
    console.error(formatError(error));
    process.exit(1);
  }
}
