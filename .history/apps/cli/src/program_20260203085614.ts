/**
 * SED - Semantic Entropy Differencing
 * CLI Program Configuration
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Command } from 'commander';
import { name, version, description } from './version.js';
import { createAnalyzeCommand } from './commands/analyze.js';
import { createCompareCommand } from './commands/compare.js';
import { createReportCommand } from './commands/report.js';
import { createConfigCommand } from './commands/config.js';
import { createInfoCommand } from './commands/info.js';

/**
 * Create the main CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(name)
    .version(version)
    .description(description)
    .option('-C, --cwd <path>', 'Set working directory', process.cwd())
    .option('--no-color', 'Disable colored output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--debug', 'Enable debug mode');

  // Add commands
  program.addCommand(createAnalyzeCommand());
  program.addCommand(createCompareCommand());
  program.addCommand(createReportCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createInfoCommand());

  // Default action (no command)
  program.action(() => {
    program.help();
  });

  // Error handling
  program.configureOutput({
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(`\x1b[31m${str}\x1b[0m`),
  });

  return program;
}

export { name, version, description };
