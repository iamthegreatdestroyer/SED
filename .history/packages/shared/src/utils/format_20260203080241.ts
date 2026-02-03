/**
 * SED - Semantic Entropy Differencing
 * Formatting Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { EntropyLevel, DiffStats, EntropyAnalysis } from '../types/index.js';

/**
 * ANSI color codes for terminal output
 */
export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Entropy levels
  minimal: '\x1b[32m',    // green
  low: '\x1b[36m',        // cyan
  moderate: '\x1b[33m',   // yellow
  high: '\x1b[35m',       // magenta
  critical: '\x1b[31m',   // red
  
  // Diff operations
  add: '\x1b[32m',        // green
  remove: '\x1b[31m',     // red
  modify: '\x1b[33m',     // yellow
  move: '\x1b[36m',       // cyan
  rename: '\x1b[35m',     // magenta
} as const;

/**
 * Get color for entropy level
 */
export function getEntropyColor(level: EntropyLevel, colorize = true): string {
  if (!colorize) return '';
  return COLORS[level];
}

/**
 * Format entropy value as percentage
 */
export function formatEntropyPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format entropy score with level indicator
 */
export function formatEntropyScore(
  analysis: EntropyAnalysis,
  colorize = true
): string {
  const color = colorize ? getEntropyColor(analysis.level) : '';
  const reset = colorize ? COLORS.reset : '';
  
  return `${color}${formatEntropyPercent(analysis.changeScore)} [${analysis.level.toUpperCase()}]${reset}`;
}

/**
 * Format entropy bar visualization
 */
export function formatEntropyBar(
  value: number,
  width = 20,
  colorize = true
): string {
  const filled = Math.round(value * width);
  const empty = width - filled;
  
  const level = value < 0.1 ? 'minimal' :
                value < 0.3 ? 'low' :
                value < 0.6 ? 'moderate' :
                value < 0.8 ? 'high' : 'critical';
  
  const color = colorize ? getEntropyColor(level) : '';
  const reset = colorize ? COLORS.reset : '';
  
  return `${color}${'█'.repeat(filled)}${'░'.repeat(empty)}${reset}`;
}

/**
 * Format diff stats summary
 */
export function formatDiffStats(stats: DiffStats, colorize = true): string {
  const add = colorize ? COLORS.add : '';
  const remove = colorize ? COLORS.remove : '';
  const modify = colorize ? COLORS.modify : '';
  const reset = colorize ? COLORS.reset : '';
  
  const parts: string[] = [];
  
  if (stats.additions > 0) {
    parts.push(`${add}+${stats.additions}${reset}`);
  }
  if (stats.deletions > 0) {
    parts.push(`${remove}-${stats.deletions}${reset}`);
  }
  if (stats.modifications > 0) {
    parts.push(`${modify}~${stats.modifications}${reset}`);
  }
  if (stats.moves > 0) {
    parts.push(`→${stats.moves}`);
  }
  if (stats.renames > 0) {
    parts.push(`⟳${stats.renames}`);
  }
  
  return parts.join(' ');
}

/**
 * Format file path with optional truncation
 */
export function formatPath(path: string, maxLength = 50): string {
  if (path.length <= maxLength) return path;
  
  const parts = path.split('/');
  let result = parts[parts.length - 1] ?? '';
  
  for (let i = parts.length - 2; i >= 0; i--) {
    const next = `${parts[i]}/${result}`;
    if (next.length > maxLength - 3) {
      return `.../${result}`;
    }
    result = next;
  }
  
  return result;
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format byte size in human-readable form
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Indent text by level
 */
export function indent(text: string, level: number, spaces = 2): string {
  const prefix = ' '.repeat(level * spaces);
  return text.split('\n').map(line => prefix + line).join('\n');
}

/**
 * Create a box around text
 */
export function box(text: string, title?: string): string {
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length), title?.length ?? 0);
  
  const top = title
    ? `┌─ ${title} ${'─'.repeat(maxWidth - title.length - 1)}┐`
    : `┌${'─'.repeat(maxWidth + 2)}┐`;
  const bottom = `└${'─'.repeat(maxWidth + 2)}┘`;
  
  const boxedLines = lines.map(line => 
    `│ ${line.padEnd(maxWidth)} │`
  );
  
  return [top, ...boxedLines, bottom].join('\n');
}
