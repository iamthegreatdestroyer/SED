/**
 * SED - Semantic Entropy Differencing
 * Test Utilities
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SemanticNode,
  MerkleNode,
  Change,
  NodeEntropy,
  ChangeClassification,
  EntropyLevel,
  ChangeType,
} from '@sed/shared/types';

/**
 * Create a mock semantic node for testing
 */
export function createSemanticNode(
  type: string,
  name: string,
  content: string = '',
  children: SemanticNode[] = []
): SemanticNode {
  return {
    id: `semantic-${name}-${randomId()}`,
    type,
    name,
    content,
    range: { start: 0, end: content.length },
    children,
  };
}

/**
 * Create a mock Merkle node for testing
 */
export function createMerkleNode(
  type: string,
  name: string,
  content: string = '',
  children: MerkleNode[] = [],
  depth: number = 0
): MerkleNode {
  const contentHash = simpleHash(`content-${content}`);
  const structuralHash = simpleHash(`structure-${type}-${children.length}`);
  const merkleHash = simpleHash(`${contentHash}-${structuralHash}`);

  return {
    id: `merkle-${name}-${randomId()}`,
    type,
    name,
    content,
    range: { start: 0, end: content.length },
    contentHash,
    structuralHash,
    merkleHash,
    children,
    depth,
  };
}

/**
 * Create a mock change for testing
 */
export function createChange(
  nodeId: string,
  nodeType: string,
  changeType: ChangeType,
  options: Partial<Change> = {}
): Change {
  const base: Change = {
    nodeId,
    nodeType,
    nodeName: nodeId,
    changeType,
    before:
      changeType === 'added'
        ? null
        : {
            content: 'before content',
            hash: simpleHash('before'),
          },
    after:
      changeType === 'removed'
        ? null
        : {
            content: 'after content',
            hash: simpleHash('after'),
          },
    depth: 0,
    ...options,
  };

  return base;
}

/**
 * Create a mock node entropy for testing
 */
export function createNodeEntropy(
  nodeName: string,
  nodeType: string,
  normalizedEntropy: number,
  level: EntropyLevel
): NodeEntropy {
  return {
    nodeId: `node-${nodeName}`,
    nodeName,
    nodeType,
    entropy: normalizedEntropy * 10,
    normalizedEntropy,
    level,
    changeType: 'modified',
  };
}

/**
 * Create a mock change classification for testing
 */
export function createClassification(
  changeId: string,
  level: 'trivial' | 'minor' | 'moderate' | 'significant' | 'major' | 'critical',
  entropy: number = 0.5,
  tags: string[] = []
): ChangeClassification {
  return {
    changeId,
    level,
    riskScore: levelToRiskScore(level),
    entropy: createNodeEntropy('node', 'function', entropy, entropyLevelFromRisk(level)),
    reviewRequired: level === 'major' || level === 'critical',
    tags,
    reason: `Classified as ${level}`,
  };
}

/**
 * Create TypeScript sample code for testing
 */
export function createTypeScriptSample(variant: 'simple' | 'class' | 'module' = 'simple'): string {
  switch (variant) {
    case 'simple':
      return `
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const result = greet('World');
`.trim();

    case 'class':
      return `
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

class BasicCalculator implements Calculator {
  private history: number[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(result);
    return result;
  }

  subtract(a: number, b: number): number {
    const result = a - b;
    this.history.push(result);
    return result;
  }

  getHistory(): number[] {
    return [...this.history];
  }
}

export { Calculator, BasicCalculator };
`.trim();

    case 'module':
      return `
// Types
export interface User {
  id: string;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Constants
export const DEFAULT_ROLE: UserRole = 'user';

// Functions
export function createUser(name: string, email: string): User {
  return {
    id: generateId(),
    name,
    email,
  };
}

export function validateEmail(email: string): boolean {
  const pattern = /^[^@]+@[^@]+\\.[^@]+$/;
  return pattern.test(email);
}

// Private helpers
function generateId(): string {
  return Math.random().toString(36).slice(2);
}
`.trim();
  }
}

/**
 * Create Python sample code for testing
 */
export function createPythonSample(): string {
  return `
def greet(name: str) -> str:
    return f"Hello, {name}!"

class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a: int, b: int) -> int:
        result = a + b
        self.history.append(result)
        return result
    
    def get_history(self) -> list:
        return self.history.copy()

if __name__ == "__main__":
    calc = Calculator()
    print(calc.add(1, 2))
`.trim();
}

/**
 * Create JavaScript sample code for testing
 */
export function createJavaScriptSample(): string {
  return `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoFib = (() => {
  const cache = {};
  return function fib(n) {
    if (n in cache) return cache[n];
    if (n <= 1) return n;
    cache[n] = fib(n - 1) + fib(n - 2);
    return cache[n];
  };
})();

module.exports = { fibonacci, memoFib };
`.trim();
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an array of mock changes
 */
export function createChangeBatch(count: number, type: ChangeType = 'modified'): Change[] {
  return Array.from({ length: count }, (_, i) => createChange(`node${i}`, 'function', type));
}

/**
 * Create mock tree for testing
 */
export function createMockTree(depth: number = 2, breadth: number = 2): MerkleNode {
  function buildLevel(currentDepth: number, prefix: string): MerkleNode {
    const children: MerkleNode[] = [];

    if (currentDepth < depth) {
      for (let i = 0; i < breadth; i++) {
        children.push(buildLevel(currentDepth + 1, `${prefix}.${i}`));
      }
    }

    return createMerkleNode(
      currentDepth === 0 ? 'module' : currentDepth === 1 ? 'class' : 'function',
      `node${prefix}`,
      `content for ${prefix}`,
      children,
      currentDepth
    );
  }

  return buildLevel(0, 'root');
}

// Helper utilities
function randomId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function levelToRiskScore(level: string): number {
  const scores: Record<string, number> = {
    trivial: 0.1,
    minor: 0.25,
    moderate: 0.45,
    significant: 0.65,
    major: 0.8,
    critical: 0.95,
  };
  return scores[level] ?? 0.5;
}

function entropyLevelFromRisk(level: string): EntropyLevel {
  const mapping: Record<string, EntropyLevel> = {
    trivial: 'minimal',
    minor: 'low',
    moderate: 'moderate',
    significant: 'high',
    major: 'high',
    critical: 'critical',
  };
  return mapping[level] ?? 'moderate';
}
