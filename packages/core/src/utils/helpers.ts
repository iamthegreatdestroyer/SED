/**
 * SED - Semantic Entropy Differencing
 * Utility Functions
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SourcePosition, SourceRange, EntropyHotspot, EntropyLevel } from '@sed/shared';

/**
 * Create a SourcePosition with offset calculated from line/column
 * @param line Line number (0-based)
 * @param column Column number (0-based)
 * @param offset Optional offset (defaults to 0 if unknown)
 */
export function createSourcePosition(
  line: number,
  column: number,
  offset: number = 0
): SourcePosition {
  return { line, column, offset };
}

/**
 * Create a SourceRange from start/end positions
 */
export function createSourceRange(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  startOffset: number = 0,
  endOffset: number = 0
): SourceRange {
  return {
    start: createSourcePosition(startLine, startColumn, startOffset),
    end: createSourcePosition(endLine, endColumn, endOffset),
  };
}

/**
 * Create an EntropyHotspot with all required properties
 */
export function createEntropyHotspot(
  nodeId: string,
  nodeName: string,
  nodeType: string,
  entropy: number,
  normalizedEntropy: number,
  level: EntropyLevel,
  rank: number,
  recommendation: string
): EntropyHotspot {
  return {
    nodeId,
    entropy,
    reason: `High entropy detected in ${nodeType} '${nodeName}'`,
    suggestedReview: level === 'high' || level === 'critical',
    affectedNodes: [nodeId],
    // Legacy properties for backward compatibility
    nodeName,
    nodeType,
    normalizedEntropy,
    level,
  };
}

/**
 * Safe property access with default value
 */
export function getOrDefault<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Check if value is defined
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
