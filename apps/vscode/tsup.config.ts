/**
 * SED - Semantic Entropy Differencing
 * VS Code Extension Build Configuration
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: false,
  treeshake: true,
  external: ['vscode'],
  noExternal: ['@sed/core', '@sed/git', '@sed/shared'],
  dts: false,
  splitting: false,
  target: 'node18',
  platform: 'node',
  esbuildOptions(options) {
    options.define = {
      'process.env.NODE_ENV': JSON.stringify('production'),
    };
  },
});
