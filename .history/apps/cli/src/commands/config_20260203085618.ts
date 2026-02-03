/**
 * SED - Semantic Entropy Differencing
 * CLI Config Command
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, dirname } from 'path';
import { writeFile, readFile, access, mkdir } from 'fs/promises';
import { loadConfig, findConfigFile, DEFAULT_CONFIG } from '../config/loader.js';
import { formatError } from '../formatters/index.js';

/**
 * Create the config command
 */
export function createConfigCommand(): Command {
  const command = new Command('config');

  command.description('Manage SED configuration');

  // config init
  command
    .command('init')
    .description('Initialize a new configuration file')
    .option('--force', 'Overwrite existing configuration')
    .option('--json', 'Create .sedrc.json instead of sed.config.js')
    .action(async (options) => {
      await initConfig(options);
    });

  // config show
  command
    .command('show')
    .description('Show current configuration')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await showConfig(options);
    });

  // config set
  command
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      await setConfig(key, value);
    });

  // config get
  command
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key: string) => {
      await getConfig(key);
    });

  // config path
  command
    .command('path')
    .description('Show configuration file path')
    .action(async () => {
      await showConfigPath();
    });

  return command;
}

/**
 * Initialize configuration file
 */
async function initConfig(options: { force?: boolean; json?: boolean }): Promise<void> {
  const cwd = process.cwd();

  try {
    // Check if config already exists
    const existingConfig = await findConfigFile(cwd);

    if (existingConfig && !options.force) {
      console.log(chalk.yellow('Configuration file already exists:'), existingConfig);
      console.log('Use --force to overwrite');
      return;
    }

    // Create config file
    const filename = options.json ? '.sedrc.json' : 'sed.config.js';
    const filepath = resolve(cwd, filename);

    let content: string;

    if (options.json) {
      content = JSON.stringify(DEFAULT_CONFIG, null, 2);
    } else {
      content = `/**
 * SED Configuration
 * @type {import('@sed/cli').SEDConfig}
 */
export default ${JSON.stringify(DEFAULT_CONFIG, null, 2)};
`;
    }

    await writeFile(filepath, content, 'utf-8');
    console.log(chalk.green('✓'), `Created configuration file: ${filename}`);
  } catch (error) {
    console.error(formatError(error));
    process.exit(2);
  }
}

/**
 * Show current configuration
 */
async function showConfig(options: { json?: boolean }): Promise<void> {
  const cwd = process.cwd();

  try {
    const config = await loadConfig(cwd);

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log(chalk.bold('\nCurrent Configuration:\n'));
      console.log(formatConfigObject(config, 0));
    }
  } catch (error) {
    console.error(formatError(error));
    process.exit(2);
  }
}

/**
 * Format config object for display
 */
function formatConfigObject(obj: Record<string, any>, indent: number): string {
  const padding = '  '.repeat(indent);
  let output = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      output += `${padding}${chalk.cyan(key)}:\n`;
      output += formatConfigObject(value, indent + 1);
    } else if (Array.isArray(value)) {
      output += `${padding}${chalk.cyan(key)}: ${chalk.yellow(JSON.stringify(value))}\n`;
    } else {
      output += `${padding}${chalk.cyan(key)}: ${chalk.green(String(value))}\n`;
    }
  }

  return output;
}

/**
 * Set a configuration value
 */
async function setConfig(key: string, value: string): Promise<void> {
  const cwd = process.cwd();

  try {
    const configPath = await findConfigFile(cwd);

    if (!configPath) {
      console.log(chalk.yellow('No configuration file found. Run `sed config init` first.'));
      process.exit(2);
    }

    // Only support JSON config for now
    if (!configPath.endsWith('.json')) {
      console.log(chalk.yellow('Setting values only supported for .sedrc.json'));
      console.log('Please edit your sed.config.js manually.');
      process.exit(2);
    }

    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Set nested key (e.g., "threshold.critical")
    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Parse value
    let parsedValue: any = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(Number(value))) parsedValue = Number(value);
    else if (value.startsWith('[') || value.startsWith('{')) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string
      }
    }

    current[keys[keys.length - 1]] = parsedValue;

    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(chalk.green('✓'), `Set ${key} = ${JSON.stringify(parsedValue)}`);
  } catch (error) {
    console.error(formatError(error));
    process.exit(2);
  }
}

/**
 * Get a configuration value
 */
async function getConfig(key: string): Promise<void> {
  const cwd = process.cwd();

  try {
    const config = await loadConfig(cwd);

    // Get nested key
    const keys = key.split('.');
    let current: any = config;

    for (const k of keys) {
      if (current === undefined || current === null) {
        console.log(chalk.yellow(`Key not found: ${key}`));
        return;
      }
      current = current[k];
    }

    if (typeof current === 'object') {
      console.log(JSON.stringify(current, null, 2));
    } else {
      console.log(current);
    }
  } catch (error) {
    console.error(formatError(error));
    process.exit(2);
  }
}

/**
 * Show configuration file path
 */
async function showConfigPath(): Promise<void> {
  const cwd = process.cwd();

  try {
    const configPath = await findConfigFile(cwd);

    if (configPath) {
      console.log(configPath);
    } else {
      console.log(chalk.yellow('No configuration file found'));
      console.log('Using default configuration');
    }
  } catch (error) {
    console.error(formatError(error));
    process.exit(2);
  }
}
