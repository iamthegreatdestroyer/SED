/**
 * SED - Semantic Entropy Differencing
 * Semantic Analysis Types
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

/**
 * Supported programming languages for AST parsing
 */
export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp';

/**
 * Types of semantic nodes in the AST
 */
export type SemanticNodeType =
  | 'function'
  | 'class'
  | 'method'
  | 'variable'
  | 'import'
  | 'export'
  | 'type'
  | 'interface'
  | 'enum'
  | 'block'
  | 'statement'
  | 'expression'
  | 'comment'
  | 'module'
  | 'other'
  | 'unknown';

/**
 * Position in source code
 */
export interface SourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

/**
 * Range in source code
 */
export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

/**
 * A node in the semantic AST
 */
export interface SemanticNode {
  readonly id: string;
  readonly type: SemanticNodeType;
  readonly name: string;
  readonly range: SourceRange;
  readonly children: readonly SemanticNode[];
  readonly hash: string;
  readonly metadata: SemanticMetadata;
  // Legacy/convenience properties
  readonly contentHash: string; // Content-based hash
  readonly startLine: number; // range.start.line
  readonly endLine: number; // range.end.line
}

/**
 * Metadata attached to semantic nodes
 */
export interface SemanticMetadata {
  readonly visibility?: 'public' | 'private' | 'protected' | 'internal';
  readonly isAsync?: boolean;
  readonly isStatic?: boolean;
  readonly isExported?: boolean;
  readonly parameters?: readonly ParameterInfo[];
  readonly returnType?: string;
  readonly docstring?: string;
  readonly decorators?: readonly string[];
  readonly complexity?: number;
  readonly language?: SupportedLanguage;
  readonly scope?: string[]; // Legacy property for backward compatibility
}

/**
 * Parameter information for functions/methods
 */
export interface ParameterInfo {
  readonly name: string;
  readonly type?: string;
  readonly defaultValue?: string;
  readonly isOptional?: boolean;
  readonly isRest?: boolean;
}

/**
 * Semantic Merkle Tree node
 */
export interface MerkleNode {
  readonly hash: string;
  readonly semanticNode: SemanticNode;
  readonly children: readonly MerkleNode[];
  readonly structuralHash: string;
  readonly contentHash: string;
  // Legacy/convenience properties for compatibility
  readonly merkleHash: string; // Alias for hash
  readonly id: string; // From semanticNode.id
  readonly name: string; // From semanticNode.name
  readonly type: SemanticNodeType; // From semanticNode.type
  readonly depth: number; // Tree depth
  readonly startLine: number; // From semanticNode.range.start.line
  readonly endLine: number; // From semanticNode.range.end.line
}

/**
 * Result of semantic parsing
 */
export interface SemanticParseResult {
  readonly language: SupportedLanguage;
  readonly root: SemanticNode;
  readonly merkleRoot: MerkleNode;
  readonly nodeCount: number;
  readonly parseTime: number;
  readonly errors: readonly ParseError[];
  readonly metadata: {
    readonly parseTime: number; // Duplicate for compatibility
  };
}

/**
 * Parse error information
 */
export interface ParseError {
  readonly message: string;
  readonly range: SourceRange;
  readonly severity: 'error' | 'warning';
}
