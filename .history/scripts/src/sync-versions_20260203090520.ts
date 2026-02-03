/**
 * SED - Semantic Entropy Differencing
 * Version synchronization utilities
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

interface SyncOptions {
  dryRun?: boolean;
  version?: string;
}

async function getPackagePaths(): Promise<string[]> {
  return glob(['packages/*/package.json', 'apps/*/package.json'], {
    cwd: ROOT,
    absolute: true,
  });
}

async function syncVersions(options: SyncOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n🔄 Synchronizing Package Versions\n'));

  const rootPkg = await fs.readJson(path.join(ROOT, 'package.json'));
  const targetVersion = options.version || rootPkg.version;

  console.log(`Target version: ${chalk.green(targetVersion)}\n`);

  const packagePaths = await getPackagePaths();
  const updates: Array<{ name: string; from: string; to: string }> = [];

  for (const pkgPath of packagePaths) {
    const pkg = await fs.readJson(pkgPath);
    
    if (pkg.version !== targetVersion) {
      updates.push({
        name: pkg.name,
        from: pkg.version,
        to: targetVersion,
      });
    }
  }

  if (updates.length === 0) {
    console.log(chalk.green('All packages are already in sync!'));
    return;
  }

  console.log(chalk.yellow('Packages to update:'));
  for (const update of updates) {
    console.log(`  ${update.name}: ${chalk.red(update.from)} → ${chalk.green(update.to)}`);
  }
  console.log('');

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - no changes made'));
    return;
  }

  const spinner = ora('Updating versions...').start();

  for (const pkgPath of packagePaths) {
    const pkg = await fs.readJson(pkgPath);
    pkg.version = targetVersion;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  spinner.succeed(`Updated ${updates.length} packages to ${targetVersion}`);
}

async function syncDependencies(options: SyncOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n🔗 Synchronizing Internal Dependencies\n'));

  const packagePaths = await getPackagePaths();
  const packages: Record<string, string> = {};

  // Collect all package versions
  for (const pkgPath of packagePaths) {
    const pkg = await fs.readJson(pkgPath);
    packages[pkg.name] = pkg.version;
  }

  const updates: Array<{ pkg: string; dep: string; from: string; to: string }> = [];

  // Update references
  for (const pkgPath of packagePaths) {
    const pkg = await fs.readJson(pkgPath);

    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (!pkg[depType]) continue;

      for (const [depName, depVersion] of Object.entries(pkg[depType])) {
        // Skip workspace: protocol (already correct)
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          continue;
        }

        // Check if this is an internal package
        if (packages[depName]) {
          const expectedVersion = `^${packages[depName]}`;
          if (depVersion !== expectedVersion) {
            updates.push({
              pkg: pkg.name,
              dep: depName,
              from: depVersion as string,
              to: expectedVersion,
            });

            if (!options.dryRun) {
              pkg[depType][depName] = expectedVersion;
            }
          }
        }
      }
    }

    if (!options.dryRun && updates.some(u => u.pkg === pkg.name)) {
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }
  }

  if (updates.length === 0) {
    console.log(chalk.green('All internal dependencies are in sync!'));
    return;
  }

  console.log(chalk.yellow('Dependencies to update:'));
  for (const update of updates) {
    console.log(`  ${update.pkg}: ${update.dep} ${chalk.red(update.from)} → ${chalk.green(update.to)}`);
  }

  if (options.dryRun) {
    console.log(chalk.yellow('\nDry run - no changes made'));
  } else {
    console.log(chalk.green(`\nUpdated ${updates.length} dependency references`));
  }
}

async function showVersions(): Promise<void> {
  console.log(chalk.blue.bold('\n📦 Package Versions\n'));

  const rootPkg = await fs.readJson(path.join(ROOT, 'package.json'));
  console.log(`Root: ${chalk.cyan(rootPkg.version)}\n`);

  const packagePaths = await getPackagePaths();

  console.log(chalk.dim('Packages:'));
  for (const pkgPath of packagePaths.filter(p => p.includes('/packages/'))) {
    const pkg = await fs.readJson(pkgPath);
    const indicator = pkg.version === rootPkg.version 
      ? chalk.green('✓') 
      : chalk.red('✗');
    console.log(`  ${indicator} ${pkg.name}: ${pkg.version}`);
  }

  console.log(chalk.dim('\nApps:'));
  for (const pkgPath of packagePaths.filter(p => p.includes('/apps/'))) {
    const pkg = await fs.readJson(pkgPath);
    const indicator = pkg.version === rootPkg.version 
      ? chalk.green('✓') 
      : chalk.red('✗');
    console.log(`  ${indicator} ${pkg.name}: ${pkg.version}`);
  }
}

// CLI
program
  .name('sync-versions')
  .description('Synchronize package versions across monorepo')
  .version('0.1.0');

program
  .command('versions')
  .description('Sync all package versions to root')
  .option('-d, --dry-run', 'Show what would change')
  .option('-v, --version <version>', 'Target version')
  .action(syncVersions);

program
  .command('deps')
  .description('Sync internal dependency versions')
  .option('-d, --dry-run', 'Show what would change')
  .action(syncDependencies);

program
  .command('show')
  .description('Show all package versions')
  .action(showVersions);

program
  .command('all')
  .description('Sync versions and dependencies')
  .option('-d, --dry-run', 'Show what would change')
  .option('-v, --version <version>', 'Target version')
  .action(async (options) => {
    await syncVersions(options);
    await syncDependencies(options);
  });

program.parse();
