/**
 * SED - Semantic Entropy Differencing
 * Hash Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { createHash } from 'node:crypto';

/**
 * Compute SHA-256 hash of content
 */
export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Compute a short hash (first 8 chars) for display
 */
export function shortHash(content: string): string {
  return sha256(content).slice(0, 8);
}

/**
 * Combine multiple hashes into one (for Merkle tree)
 */
export function combineHashes(...hashes: readonly string[]): string {
  return sha256(hashes.join(':'));
}

/**
 * Compute structural hash (ignores content details, focuses on shape)
 */
export function structuralHash(structure: {
  type: string;
  childTypes: readonly string[];
  depth: number;
}): string {
  return sha256(JSON.stringify(structure));
}

/**
 * Compute content hash (focuses on actual content)
 */
export function contentHash(content: string): string {
  // Normalize whitespace for consistent hashing
  const normalized = content.replace(/\s+/g, ' ').trim();
  return sha256(normalized);
}

/**
 * Generate a unique ID based on content and timestamp
 */
export function generateId(content: string): string {
  const timestamp = Date.now().toString(36);
  const hash = shortHash(content + timestamp);
  return `${timestamp}-${hash}`;
}
