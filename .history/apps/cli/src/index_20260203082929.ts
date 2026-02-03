#!/usr/bin/env node
/**
 * SED - Semantic Entropy Differencing
 * CLI Entry Point
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import 'dotenv/config';
import { createProgram } from './program.js';

// Run the CLI
const program = createProgram();
program.parseAsync(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
