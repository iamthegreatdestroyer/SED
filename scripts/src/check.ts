/**
 * SED - Semantic Entropy Differencing
 * Workspace health check utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { execaCommand } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'fast-glob';

const ROOT = path.resolve(import.meta.dirname, '../..');

interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

async function runCheck(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  const startTime = Date.now();
  const spinner = ora(name).start();

  try {
    await fn();
    const duration = Date.now() - startTime;
    spinner.succeed(`${name} ${chalk.dim(`(${duration}ms)`)}`);
    return { name, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    spinner.fail(`${name} ${chalk.dim(`(${duration}ms)`)}`);
    return {
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

async function checkPackageVersions(): Promise<void> {
  const packages = await glob(['packages/*/package.json', 'apps/*/package.json'], {
    cwd: ROOT,
    absolute: true,
  });

  const rootPkg = await fs.readJson(path.join(ROOT, 'package.json'));
  const expectedVersion = rootPkg.version;

  const mismatched: string[] = [];

  for (const pkgPath of packages) {
    const pkg = await fs.readJson(pkgPath);
    if (!pkg.private && pkg.version !== expectedVersion) {
      mismatched.push(`${pkg.name}: ${pkg.version} (expected ${expectedVersion})`);
    }
  }

  if (mismatched.length > 0) {
    throw new Error(`Version mismatch:\n${mismatched.join('\n')}`);
  }
}

async function checkDependencies(): Promise<void> {
  const packages = await glob(['packages/*/package.json', 'apps/*/package.json'], {
    cwd: ROOT,
    absolute: true,
  });

  const issues: string[] = [];

  for (const pkgPath of packages) {
    const pkg = await fs.readJson(pkgPath);
    const dir = path.dirname(pkgPath);

    // Check for missing dependencies in source
    // This is a simplified check - a real implementation would parse imports

    // Check for outdated workspace references
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const deps = pkg[depType] || {};
      for (const [name, version] of Object.entries(deps)) {
        if (typeof version === 'string' && name.startsWith('@sed/')) {
          // Should be workspace protocol
          if (!version.startsWith('workspace:')) {
            issues.push(`${pkg.name}: ${name} should use workspace: protocol`);
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Dependency issues:\n${issues.join('\n')}`);
  }
}

async function checkTypeScript(): Promise<void> {
  await execaCommand('pnpm turbo run typecheck', { shell: true });
}

async function checkLint(): Promise<void> {
  await execaCommand('pnpm turbo run lint', { shell: true });
}

async function checkTests(): Promise<void> {
  await execaCommand('pnpm turbo run test', { shell: true });
}

async function checkBuild(): Promise<void> {
  await execaCommand('pnpm turbo run build', { shell: true });
}

async function checkGitStatus(): Promise<void> {
  const { stdout } = await execaCommand('git status --porcelain', { shell: true });
  if (stdout.trim()) {
    throw new Error('Working directory has uncommitted changes');
  }
}

async function checkNodeVersion(): Promise<void> {
  const { stdout } = await execaCommand('node --version', { shell: true });
  const version = stdout.trim().replace('v', '');
  const major = parseInt(version.split('.')[0], 10);

  if (major < 18) {
    throw new Error(`Node.js 18+ required, found ${version}`);
  }
}

async function checkPnpmVersion(): Promise<void> {
  const { stdout } = await execaCommand('pnpm --version', { shell: true });
  const version = stdout.trim();
  const major = parseInt(version.split('.')[0], 10);

  if (major < 8) {
    throw new Error(`pnpm 8+ required, found ${version}`);
  }
}

async function runAllChecks(): Promise<void> {
  console.log(chalk.blue.bold('\n🔍 Running Workspace Health Checks\n'));

  const results: CheckResult[] = [];

  // Environment checks
  console.log(chalk.dim('Environment:'));
  results.push(await runCheck('Node.js version', checkNodeVersion));
  results.push(await runCheck('pnpm version', checkPnpmVersion));

  // Workspace checks
  console.log(chalk.dim('\nWorkspace:'));
  results.push(await runCheck('Package versions', checkPackageVersions));
  results.push(await runCheck('Dependencies', checkDependencies));
  results.push(await runCheck('Git status', checkGitStatus));

  // Code quality checks
  console.log(chalk.dim('\nCode Quality:'));
  results.push(await runCheck('TypeScript', checkTypeScript));
  results.push(await runCheck('Linting', checkLint));
  results.push(await runCheck('Tests', checkTests));

  // Build check
  console.log(chalk.dim('\nBuild:'));
  results.push(await runCheck('Build', checkBuild));

  // Summary
  console.log(chalk.blue.bold('\n📊 Summary\n'));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`${chalk.green(`✓ ${passed} passed`)}, ${chalk.red(`✗ ${failed} failed`)}`);

  if (failed > 0) {
    console.log(chalk.red('\nFailed checks:'));
    for (const result of results.filter((r) => !r.passed)) {
      console.log(chalk.red(`  ✗ ${result.name}`));
      if (result.message) {
        console.log(chalk.dim(`    ${result.message}`));
      }
    }
    process.exit(1);
  }

  console.log(chalk.green.bold('\n✅ All checks passed!\n'));
}

async function quickCheck(): Promise<void> {
  console.log(chalk.blue.bold('\n⚡ Quick Check\n'));

  const results: CheckResult[] = [];

  results.push(await runCheck('TypeScript', checkTypeScript));
  results.push(await runCheck('Linting', checkLint));

  const failed = results.filter((r) => !r.passed).length;
  if (failed > 0) {
    process.exit(1);
  }
}

// CLI
program.name('check').description('SED workspace health checks').version('0.1.0');

program.command('all').description('Run all health checks').action(runAllChecks);

program.command('quick').description('Quick check (typecheck + lint)').action(quickCheck);

program
  .command('versions')
  .description('Check package versions')
  .action(async () => {
    await runCheck('Package versions', checkPackageVersions);
  });

program
  .command('deps')
  .description('Check dependencies')
  .action(async () => {
    await runCheck('Dependencies', checkDependencies);
  });

program
  .command('ts')
  .description('TypeScript check')
  .action(async () => {
    await runCheck('TypeScript', checkTypeScript);
  });

program
  .command('lint')
  .description('Lint check')
  .action(async () => {
    await runCheck('Linting', checkLint);
  });

program
  .command('test')
  .description('Test check')
  .action(async () => {
    await runCheck('Tests', checkTests);
  });

program
  .command('build')
  .description('Build check')
  .action(async () => {
    await runCheck('Build', checkBuild);
  });

program.parse();
