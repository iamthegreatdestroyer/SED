/**
 * SED - Semantic Entropy Differencing
 * AST Walker for Tree-sitter Parse Trees
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SupportedLanguage, SemanticNode, SemanticNodeType } from '@sed/shared/types';
import { generateId, contentHash } from '@sed/shared/utils';

import { LanguageRegistry } from './language-registry.js';
import { createSourceRange } from '../utils/helpers.js';

/**
 * Tree-sitter node interface (simplified for typing)
 */
export interface TSNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  startIndex: number;
  endIndex: number;
  children: TSNode[];
  namedChildren: TSNode[];
  parent: TSNode | null;
  childCount: number;
  namedChildCount: number;
  firstChild: TSNode | null;
  lastChild: TSNode | null;
  nextSibling: TSNode | null;
  previousSibling: TSNode | null;
  isNamed: boolean;
  isMissing: boolean;
  hasError: boolean;
  childForFieldName(fieldName: string): TSNode | null;
}

/**
 * Context for walking the AST
 */
interface WalkContext {
  readonly language: SupportedLanguage;
  readonly source: string;
  readonly filePath: string;
  scopeStack: string[];
  depth: number;
}

/**
 * Callback for visiting nodes
 */
type NodeVisitor = (node: SemanticNode, tsNode: TSNode, context: WalkContext) => void;

/**
 * Options for AST walking
 */
interface WalkOptions {
  maxDepth?: number;
  includeAnonymous?: boolean;
  visitor?: NodeVisitor;
}

/**
 * AST Walker for traversing Tree-sitter parse trees
 * and extracting semantic nodes
 */
export class ASTWalker {
  private readonly registry: LanguageRegistry;

  constructor() {
    this.registry = LanguageRegistry.getInstance();
  }

  /**
   * Walk the AST and extract semantic nodes
   */
  walk(
    rootNode: TSNode,
    language: SupportedLanguage,
    source: string,
    filePath: string,
    options: WalkOptions = {}
  ): SemanticNode[] {
    const nodes: SemanticNode[] = [];
    const maxDepth = options.maxDepth ?? 50;
    const includeAnonymous = options.includeAnonymous ?? false;

    const context: WalkContext = {
      language,
      source,
      filePath,
      scopeStack: [],
      depth: 0,
    };

    this.walkNode(rootNode, nodes, context, maxDepth, includeAnonymous, options.visitor);

    return nodes;
  }

  /**
   * Recursively walk a node and its children
   */
  private walkNode(
    tsNode: TSNode,
    nodes: SemanticNode[],
    context: WalkContext,
    maxDepth: number,
    includeAnonymous: boolean,
    visitor?: NodeVisitor
  ): void {
    if (context.depth > maxDepth) {
      return;
    }

    // Skip ignored nodes
    if (this.registry.shouldIgnoreNode(context.language, tsNode.type)) {
      return;
    }

    // Only process named nodes unless explicitly included
    if (!tsNode.isNamed && !includeAnonymous) {
      // Still walk children
      for (const child of tsNode.children) {
        this.walkNode(child, nodes, context, maxDepth, includeAnonymous, visitor);
      }
      return;
    }

    // Check if this is a semantic node
    if (this.registry.isSemanticNode(context.language, tsNode.type)) {
      const semanticNode = this.createSemanticNode(tsNode, context);
      nodes.push(semanticNode);

      // Call visitor if provided
      if (visitor) {
        visitor(semanticNode, tsNode, context);
      }
    }

    // Check if this node creates a new scope
    const isScope = this.registry.isScopeNode(context.language, tsNode.type);
    if (isScope) {
      context.scopeStack.push(tsNode.type);
    }

    // Walk children
    context.depth++;
    for (const child of tsNode.namedChildren) {
      this.walkNode(child, nodes, context, maxDepth, includeAnonymous, visitor);
    }
    context.depth--;

    // Pop scope if we pushed one
    if (isScope) {
      context.scopeStack.pop();
    }
  }

  /**
   * Create a SemanticNode from a Tree-sitter node
   */
  private createSemanticNode(tsNode: TSNode, context: WalkContext): SemanticNode {
    const name = this.extractNodeName(tsNode, context.language);
    const nodeType = this.mapNodeType(tsNode.type, context.language);
    const startLine = tsNode.startPosition.row + 1;
    const endLine = tsNode.endPosition.row + 1;

    // Generate stable ID based on semantic location (type:name:position)
    // This ensures same node in different parses gets same ID for comparison
    const id = `${nodeType}:${name}:${startLine}-${endLine}`;

    return {
      id,
      type: nodeType,
      name,
      startLine,
      endLine,
      range: createSourceRange(
        startLine,
        tsNode.startPosition.column,
        endLine,
        tsNode.endPosition.column,
        tsNode.startIndex,
        tsNode.endIndex
      ),
      contentHash: contentHash(tsNode.text),
      children: [],
      hash: '', // Will be computed by merkle tree
      metadata: {
        language: context.language,
        scope: [...context.scopeStack],
      },
    };
  }

  /**
   * Extract the name of a node (function name, class name, etc.)
   */
  private extractNodeName(tsNode: TSNode, language: SupportedLanguage): string {
    // Try common field names for identifiers
    const nameFields = ['name', 'identifier', 'declarator'];

    for (const field of nameFields) {
      const nameNode = tsNode.childForFieldName(field);
      if (nameNode) {
        // Handle cases where the name is nested (e.g., in a declarator)
        if (nameNode.type === 'identifier' || nameNode.type === 'type_identifier') {
          return nameNode.text;
        }
        // Recursively look for identifier
        const identifier = this.findIdentifier(nameNode);
        if (identifier) {
          return identifier;
        }
      }
    }

    // Fallback: look for first identifier child
    for (const child of tsNode.namedChildren) {
      if (child.type === 'identifier' || child.type === 'type_identifier') {
        return child.text;
      }
    }

    // Use node type as fallback
    return `<anonymous_${tsNode.type}>`;
  }

  /**
   * Find an identifier node recursively
   */
  private findIdentifier(node: TSNode): string | null {
    if (node.type === 'identifier' || node.type === 'type_identifier') {
      return node.text;
    }

    for (const child of node.namedChildren) {
      const result = this.findIdentifier(child);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Map Tree-sitter node types to semantic node types
   */
  private mapNodeType(tsNodeType: string, _language: SupportedLanguage): SemanticNodeType {
    // Function types
    if (
      tsNodeType.includes('function') ||
      tsNodeType.includes('method') ||
      tsNodeType === 'arrow_function'
    ) {
      return 'function';
    }

    // Class types
    if (tsNodeType.includes('class')) {
      return 'class';
    }

    // Interface types
    if (tsNodeType.includes('interface')) {
      return 'interface';
    }

    // Type/struct types
    if (
      tsNodeType.includes('type') ||
      tsNodeType.includes('struct') ||
      tsNodeType.includes('enum')
    ) {
      return 'type';
    }

    // Variable types
    if (
      tsNodeType.includes('variable') ||
      tsNodeType.includes('const') ||
      tsNodeType.includes('assignment') ||
      tsNodeType.includes('field') ||
      tsNodeType.includes('declaration')
    ) {
      return 'variable';
    }

    // Import types
    if (tsNodeType.includes('import') || tsNodeType.includes('use')) {
      return 'import';
    }

    // Export types
    if (tsNodeType.includes('export')) {
      return 'export';
    }

    // Module/namespace types
    if (
      tsNodeType.includes('module') ||
      tsNodeType.includes('namespace') ||
      tsNodeType.includes('mod')
    ) {
      return 'module';
    }

    // Default to 'other'
    return 'other';
  }

  /**
   * Count total nodes in the tree
   */
  countNodes(rootNode: TSNode): number {
    let count = 1;
    for (const child of rootNode.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  /**
   * Get the depth of the tree
   */
  getTreeDepth(rootNode: TSNode, currentDepth = 0): number {
    if (rootNode.childCount === 0) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;
    for (const child of rootNode.children) {
      const childDepth = this.getTreeDepth(child, currentDepth + 1);
      if (childDepth > maxChildDepth) {
        maxChildDepth = childDepth;
      }
    }

    return maxChildDepth;
  }
}
