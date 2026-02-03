/**
 * SED - Semantic Entropy Differencing
 * Release automation utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { execaCommand } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import prompts from 'prompts';
import semver from 'semver';
import { glob } from 'fast-glob';

const ROOT = path.resolve(import.meta.dirname, '../..');

type ReleaseType =
  | 'major'
  | 'minor'
  | 'patch'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

interface ReleaseOptions {
  dryRun?: boolean;
  skipTests?: boolean;
  skipGit?: boolean;
  tag?: string;
}

async function getPackages(): Promise<Array<{ name: string; version: string; path: string }>> {
  const packageJsons = await glob(['packages/*/package.json', 'apps/*/package.json'], {
    cwd: ROOT,
    absolute: true,
  });

  const packages = [];
  for (const pkgPath of packageJsons) {
    const pkg = await fs.readJson(pkgPath);
    if (!pkg.private) {
      packages.push({
        name: pkg.name,
        version: pkg.version,
        path: path.dirname(pkgPath),
      });
    }
  }

  return packages;
}

async function updateVersion(pkgPath: string, newVersion: string): Promise<void> {
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  const pkg = await fs.readJson(pkgJsonPath);
  pkg.version = newVersion;
  await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
}

async function updateDependencies(
  pkgPath: string,
  packageName: string,
  newVersion: string
): Promise<void> {
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  const pkg = await fs.readJson(pkgJsonPath);

  let updated = false;

  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (pkg[depType]?.[packageName]) {
      // Don't update workspace: protocol references
      if (!pkg[depType][packageName].startsWith('workspace:')) {
        pkg[depType][packageName] = `^${newVersion}`;
        updated = true;
      }
    }
  }

  if (updated) {
    await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
  }
}

async function runPreReleaseChecks(options: ReleaseOptions): Promise<void> {
  if (options.skipTests) {
    console.log(chalk.yellow('Skipping pre-release checks'));
    return;
  }

  console.log(chalk.blue.bold('\n🔍 Running Pre-Release Checks\n'));

  // Type check
  const typeSpinner = ora('Type checking...').start();
  try {
    await execaCommand('pnpm turbo run typecheck', { shell: true });
    typeSpinner.succeed('Type checks passed');
  } catch (error) {
    typeSpinner.fail('Type checks failed');
    throw error;
  }

  // Lint
  const lintSpinner = ora('Linting...').start();
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
  const buildSpinner = ora('Building...').start();
  try {
    await execaCommand('pnpm turbo run build', { shell: true });
    buildSpinner.succeed('Build passed');
  } catch (error) {
    buildSpinner.fail('Build failed');
    throw error;
  }
}

async function createGitRelease(version: string, options: ReleaseOptions): Promise<void> {
  if (options.skipGit || options.dryRun) {
    console.log(chalk.yellow('Skipping Git operations'));
    return;
  }

  const tag = options.tag || `v${version}`;

  // Stage changes
  const stageSpinner = ora('Staging changes...').start();
  try {
    await execaCommand('git add -A', { shell: true });
    stageSpinner.succeed('Changes staged');
  } catch (error) {
    stageSpinner.fail('Failed to stage changes');
    throw error;
  }

  // Commit
  const commitSpinner = ora('Creating commit...').start();
  try {
    await execaCommand(`git commit -m "chore(release): ${tag}"`, { shell: true });
    commitSpinner.succeed(`Created commit: chore(release): ${tag}`);
  } catch (error) {
    commitSpinner.fail('Failed to create commit');
    throw error;
  }

  // Tag
  const tagSpinner = ora('Creating tag...').start();
  try {
    await execaCommand(`git tag -a ${tag} -m "Release ${tag}"`, { shell: true });
    tagSpinner.succeed(`Created tag: ${tag}`);
  } catch (error) {
    tagSpinner.fail('Failed to create tag');
    throw error;
  }

  console.log(chalk.yellow(`\nRun 'git push && git push --tags' to publish\n`));
}

async function publishPackages(options: ReleaseOptions): Promise<void> {
  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - skipping publish'));
    return;
  }

  const packages = await getPackages();

  console.log(chalk.blue.bold('\n📦 Publishing Packages\n'));

  for (const pkg of packages) {
    const spinner = ora(`Publishing ${pkg.name}...`).start();

    try {
      await execaCommand('npm publish --access public', {
        cwd: pkg.path,
        shell: true,
      });
      spinner.succeed(`Published ${pkg.name}@${pkg.version}`);
    } catch (error) {
      spinner.fail(`Failed to publish ${pkg.name}`);
      // Continue with other packages
    }
  }
}

async function release(releaseType: ReleaseType, options: ReleaseOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 SED Release\n'));

  // Get current version from root package.json
  const rootPkg = await fs.readJson(path.join(ROOT, 'package.json'));
  const currentVersion = rootPkg.version;
  const newVersion = semver.inc(currentVersion, releaseType, options.tag);

  if (!newVersion) {
    throw new Error(`Invalid version bump: ${releaseType}`);
  }

  console.log(`Current version: ${chalk.yellow(currentVersion)}`);
  console.log(`New version:     ${chalk.green(newVersion)}`);

  if (options.dryRun) {
    console.log(chalk.yellow('\n[DRY RUN] No changes will be made\n'));
  }

  // Confirm
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `Release version ${newVersion}?`,
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.red('Release cancelled'));
    return;
  }

  // Run checks
  await runPreReleaseChecks(options);

  // Update versions
  if (!options.dryRun) {
    console.log(chalk.blue.bold('\n📝 Updating Versions\n'));

    // Update root package.json
    const spinner = ora('Updating package versions...').start();
    rootPkg.version = newVersion;
    await fs.writeJson(path.join(ROOT, 'package.json'), rootPkg, { spaces: 2 });

    // Update all packages
    const packages = await getPackages();
    for (const pkg of packages) {
      await updateVersion(pkg.path, newVersion);
    }

    spinner.succeed('Package versions updated');

    // Update internal dependencies
    const depSpinner = ora('Updating internal dependencies...').start();
    const allPackages = await glob(['packages/*/package.json', 'apps/*/package.json'], {
      cwd: ROOT,
      absolute: true,
    });

    for (const pkgPath of allPackages) {
      for (const pkg of packages) {
        await updateDependencies(path.dirname(pkgPath), pkg.name, newVersion);
      }
    }

    depSpinner.succeed('Internal dependencies updated');
  }

  // Generate changelog
  console.log(chalk.dim('\nChangelog generation would go here...\n'));

  // Git operations
  await createGitRelease(newVersion, options);

  // Publish
  if (!options.dryRun) {
    const { publish } = await prompts({
      type: 'confirm',
      name: 'publish',
      message: 'Publish to npm?',
      initial: false,
    });

    if (publish) {
      await publishPackages(options);
    }
  }

  console.log(chalk.green.bold(`\n✅ Release ${newVersion} complete!\n`));
}

// CLI
program.name('release').description('SED release automation').version('0.1.0');

program
  .argument(
    '<type>',
    'Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)'
  )
  .option('-d, --dry-run', 'Dry run without making changes')
  .option('--skip-tests', 'Skip pre-release checks')
  .option('--skip-git', 'Skip git operations')
  .option('-t, --tag <tag>', 'Prerelease tag (e.g., alpha, beta, rc)')
  .action(release);

program.parse();
