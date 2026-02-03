/**
 * SED - Semantic Entropy Differencing
 * Semantic Parser for Source Code
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type {
  SupportedLanguage,
  SemanticNode,
  SemanticParseResult,
  ParserOptions,
} from '@sed/shared/types';
import { detectLanguage, generateId } from '@sed/shared/utils';

import { ASTWalker } from './ast-walker.js';
import { LanguageRegistry } from './language-registry.js';

/**
 * Default parser options
 */
const DEFAULT_OPTIONS: Required<ParserOptions> = {
  includeComments: false,
  maxDepth: 50,
  timeout: 5000,
};

/**
 * Semantic Parser for extracting semantic structure from source code
 * Uses Tree-sitter for multi-language parsing
 */
export class SemanticParser {
  private readonly registry: LanguageRegistry;
  private readonly walker: ASTWalker;
  private parser: unknown = null;

  constructor() {
    this.registry = LanguageRegistry.getInstance();
    this.walker = new ASTWalker();
  }

  /**
   * Parse source code and extract semantic nodes
   */
  async parse(
    source: string,
    filePath: string,
    language?: SupportedLanguage,
    options: ParserOptions = {}
  ): Promise<SemanticParseResult> {
    const startTime = performance.now();
    const resolvedLanguage = language ?? this.detectLanguage(filePath);
    const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

    if (!resolvedLanguage) {
      throw new Error(`Could not detect language for file: ${filePath}`);
    }

    if (!this.registry.isSupported(resolvedLanguage)) {
      throw new Error(`Unsupported language: ${resolvedLanguage}`);
    }

    try {
      // Initialize parser if needed
      await this.initializeParser(resolvedLanguage);

      // Parse source code
      const tree = await this.parseSource(source, resolvedOptions.timeout);

      if (!tree) {
        throw new Error('Failed to parse source code');
      }

      // Walk AST and extract semantic nodes
      const nodes = this.walker.walk(tree.rootNode, resolvedLanguage, source, filePath, {
        maxDepth: resolvedOptions.maxDepth,
        includeAnonymous: false,
      });

      // Build hierarchy
      const rootNodes = this.buildHierarchy(nodes);

      const parseTime = performance.now() - startTime;

      return {
        filePath,
        language: resolvedLanguage,
        nodes: rootNodes,
        parseTime,
        errors: tree.rootNode.hasError ? this.extractErrors(tree.rootNode) : [],
        metadata: {
          totalNodes: nodes.length,
          maxDepth: this.calculateMaxDepth(rootNodes),
          hasErrors: tree.rootNode.hasError,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse multiple files in parallel
   */
  async parseMany(
    files: Array<{ source: string; filePath: string; language?: SupportedLanguage }>,
    options: ParserOptions = {}
  ): Promise<SemanticParseResult[]> {
    return Promise.all(
      files.map((file) => this.parse(file.source, file.filePath, file.language, options))
    );
  }

  /**
   * Quick parse for validation only
   */
  async validate(source: string, language: SupportedLanguage): Promise<boolean> {
    try {
      await this.initializeParser(language);
      const tree = await this.parseSource(source, 1000);
      return tree?.rootNode && !tree.rootNode.hasError;
    } catch {
      return false;
    }
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(filePath: string): SupportedLanguage | null {
    const detected = detectLanguage(filePath);
    return this.registry.isSupported(detected) ? detected : null;
  }

  /**
   * Initialize Tree-sitter parser for a language
   */
  private async initializeParser(language: SupportedLanguage): Promise<void> {
    if (this.parser) {
      return;
    }

    try {
      // Dynamic import of tree-sitter
      const Parser = (await import('tree-sitter')).default;
      const languageModule = await this.registry.loadParser(language);

      this.parser = new Parser();
      (this.parser as { setLanguage: (lang: unknown) => void }).setLanguage(languageModule);
    } catch (error) {
      throw new Error(
        `Failed to initialize parser for ${language}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Parse source code with timeout
   */
  private async parseSource(
    source: string,
    timeout: number
  ): Promise<{ rootNode: { hasError: boolean; children: unknown[]; type: string } } | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Parse timeout after ${timeout}ms`));
      }, timeout);

      try {
        const tree = (this.parser as { parse: (source: string) => unknown }).parse(source);
        clearTimeout(timer);
        resolve(tree as { rootNode: { hasError: boolean; children: unknown[]; type: string } });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Build hierarchy from flat list of semantic nodes
   */
  private buildHierarchy(nodes: SemanticNode[]): SemanticNode[] {
    // Sort by line number
    const sorted = [...nodes].sort((a, b) => a.startLine - b.startLine);

    // Build parent-child relationships based on line ranges
    const roots: SemanticNode[] = [];
    const stack: SemanticNode[] = [];

    for (const node of sorted) {
      // Pop nodes from stack that don't contain this node
      while (stack.length > 0 && !this.nodeContains(stack[stack.length - 1]!, node)) {
        stack.pop();
      }

      if (stack.length === 0) {
        // This is a root node
        roots.push(node);
      } else {
        // Add as child to the top of the stack
        const parent = stack[stack.length - 1]!;
        parent.children.push(node);
      }

      // Push this node to the stack (it might be a parent)
      stack.push(node);
    }

    return roots;
  }

  /**
   * Check if parent node contains child node
   */
  private nodeContains(parent: SemanticNode, child: SemanticNode): boolean {
    return (
      parent.startLine <= child.startLine &&
      parent.endLine >= child.endLine &&
      parent.id !== child.id
    );
  }

  /**
   * Extract parse errors from tree
   */
  private extractErrors(rootNode: { children: unknown[]; type: string }): string[] {
    const errors: string[] = [];

    const walk = (node: {
      children?: unknown[];
      type: string;
      isMissing?: boolean;
      startPosition?: { row: number; column: number };
    }): void => {
      if (node.type === 'ERROR' || node.isMissing) {
        const pos = node.startPosition;
        errors.push(
          `Parse error at line ${(pos?.row ?? 0) + 1}, column ${pos?.column ?? 0}: ${node.type}`
        );
      }

      if (node.children) {
        for (const child of node.children) {
          walk(child as { children?: unknown[]; type: string; isMissing?: boolean });
        }
      }
    };

    walk(rootNode);
    return errors;
  }

  /**
   * Calculate maximum depth of node hierarchy
   */
  private calculateMaxDepth(nodes: SemanticNode[], depth = 0): number {
    if (nodes.length === 0) {
      return depth;
    }

    let maxDepth = depth;
    for (const node of nodes) {
      const childDepth = this.calculateMaxDepth(node.children, depth + 1);
      if (childDepth > maxDepth) {
        maxDepth = childDepth;
      }
    }

    return maxDepth;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.parser = null;
  }
}
