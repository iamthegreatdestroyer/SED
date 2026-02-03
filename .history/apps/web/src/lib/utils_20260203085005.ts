/**
 * SED - Semantic Entropy Differencing
 * Utility Functions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format entropy value
 */
export function formatEntropy(entropy: number): string {
  return entropy.toFixed(2);
}

/**
 * Format a date relative to now
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Truncate a file path for display
 */
export function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  if (parts.length <= 2) {
    return `...${path.slice(-maxLength + 3)}`;
  }

  const fileName = parts[parts.length - 1];
  const parentDir = parts[parts.length - 2];
  const ellipsis = '...';

  if (fileName.length + parentDir.length + ellipsis.length + 1 < maxLength) {
    return `${ellipsis}/${parentDir}/${fileName}`;
  }

  return `${ellipsis}${path.slice(-maxLength + 3)}`;
}

/**
 * Get color for classification
 */
export function getClassificationColor(
  classification: 'trivial' | 'low' | 'medium' | 'high' | 'critical'
): string {
  const colors = {
    trivial: '#10b981',
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[classification];
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
