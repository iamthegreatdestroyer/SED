/**
 * SED - Semantic Entropy Differencing
 * Vitest Configuration for Web App
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'src/tests/**',
        '**/*.d.ts',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@sed/core': resolve(__dirname, '../../packages/core/src'),
      '@sed/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
