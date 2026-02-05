/**
 * SED - Semantic Entropy Differencing
 * Language Registry for Tree-sitter Parsers
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SupportedLanguage } from '@sed/shared/types';

/**
 * Language configuration for Tree-sitter parsing
 */
interface LanguageConfig {
  readonly moduleName: string;
  readonly exportName?: string; // Named export for languages like TypeScript
  readonly semanticNodeTypes: readonly string[];
  readonly scopeNodeTypes: readonly string[];
  readonly ignoreNodeTypes: readonly string[];
}

/**
 * Registry of supported languages and their Tree-sitter configurations
 */
export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  typescript: {
    moduleName: 'tree-sitter-typescript',
    exportName: 'typescript',
    semanticNodeTypes: [
      'function_declaration',
      'method_definition',
      'class_declaration',
      'interface_declaration',
      'type_alias_declaration',
      'variable_declaration',
      'import_statement',
      'export_statement',
      'arrow_function',
      'function_expression',
    ],
    scopeNodeTypes: ['program', 'class_body', 'function_body', 'block', 'module'],
    ignoreNodeTypes: ['comment', 'jsx_text', 'string_content'],
  },
  javascript: {
    moduleName: 'tree-sitter-javascript',
    semanticNodeTypes: [
      'function_declaration',
      'method_definition',
      'class_declaration',
      'variable_declaration',
      'import_statement',
      'export_statement',
      'arrow_function',
      'function_expression',
    ],
    scopeNodeTypes: ['program', 'class_body', 'function_body', 'block'],
    ignoreNodeTypes: ['comment', 'jsx_text', 'string_content'],
  },
  python: {
    moduleName: 'tree-sitter-python',
    semanticNodeTypes: [
      'function_definition',
      'class_definition',
      'decorated_definition',
      'import_statement',
      'import_from_statement',
      'assignment',
      'global_statement',
    ],
    scopeNodeTypes: ['module', 'class_body', 'block'],
    ignoreNodeTypes: ['comment', 'string'],
  },
  rust: {
    moduleName: 'tree-sitter-rust',
    semanticNodeTypes: [
      'function_item',
      'impl_item',
      'struct_item',
      'enum_item',
      'trait_item',
      'mod_item',
      'use_declaration',
      'const_item',
      'static_item',
      'type_item',
      'macro_definition',
    ],
    scopeNodeTypes: ['source_file', 'impl_block', 'mod_block', 'block'],
    ignoreNodeTypes: ['line_comment', 'block_comment', 'string_literal'],
  },
  go: {
    moduleName: 'tree-sitter-go',
    semanticNodeTypes: [
      'function_declaration',
      'method_declaration',
      'type_declaration',
      'import_declaration',
      'const_declaration',
      'var_declaration',
    ],
    scopeNodeTypes: ['source_file', 'block'],
    ignoreNodeTypes: ['comment', 'raw_string_literal', 'interpreted_string_literal'],
  },
  java: {
    moduleName: 'tree-sitter-java',
    semanticNodeTypes: [
      'method_declaration',
      'constructor_declaration',
      'class_declaration',
      'interface_declaration',
      'enum_declaration',
      'field_declaration',
      'import_declaration',
    ],
    scopeNodeTypes: ['program', 'class_body', 'interface_body', 'block'],
    ignoreNodeTypes: ['line_comment', 'block_comment', 'string_literal'],
  },
  c: {
    moduleName: 'tree-sitter-c',
    semanticNodeTypes: [
      'function_definition',
      'declaration',
      'struct_specifier',
      'enum_specifier',
      'typedef_declaration',
      'preproc_include',
      'preproc_define',
    ],
    scopeNodeTypes: ['translation_unit', 'compound_statement'],
    ignoreNodeTypes: ['comment', 'string_literal'],
  },
  cpp: {
    moduleName: 'tree-sitter-cpp',
    semanticNodeTypes: [
      'function_definition',
      'class_specifier',
      'struct_specifier',
      'namespace_definition',
      'template_declaration',
      'declaration',
      'using_declaration',
    ],
    scopeNodeTypes: ['translation_unit', 'compound_statement', 'namespace_body'],
    ignoreNodeTypes: ['comment', 'raw_string_literal', 'string_literal'],
  },
  csharp: {
    moduleName: 'tree-sitter-c-sharp',
    exportName: 'c_sharp',
    semanticNodeTypes: [
      'class_declaration',
      'method_declaration',
      'interface_declaration',
      'property_declaration',
      'field_declaration',
      'constructor_declaration',
      'enum_declaration',
      'struct_declaration',
      'namespace_declaration',
      'using_directive',
    ],
    scopeNodeTypes: ['compilation_unit', 'namespace_declaration', 'class_declaration', 'block'],
    ignoreNodeTypes: ['comment', 'string_literal'],
  },
};

/**
 * Language registry for managing Tree-sitter parsers
 */
export class LanguageRegistry {
  private static instance: LanguageRegistry | null = null;
  private readonly loadedParsers = new Map<SupportedLanguage, unknown>();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LanguageRegistry {
    if (!LanguageRegistry.instance) {
      LanguageRegistry.instance = new LanguageRegistry();
    }
    return LanguageRegistry.instance;
  }

  /**
   * Get language configuration
   */
  getConfig(language: SupportedLanguage): LanguageConfig {
    return LANGUAGE_CONFIGS[language];
  }

  /**
   * Check if a node type is semantically significant
   */
  isSemanticNode(language: SupportedLanguage, nodeType: string): boolean {
    return LANGUAGE_CONFIGS[language].semanticNodeTypes.includes(nodeType);
  }

  /**
   * Check if a node type defines a scope
   */
  isScopeNode(language: SupportedLanguage, nodeType: string): boolean {
    return LANGUAGE_CONFIGS[language].scopeNodeTypes.includes(nodeType);
  }

  /**
   * Check if a node type should be ignored
   */
  shouldIgnoreNode(language: SupportedLanguage, nodeType: string): boolean {
    return LANGUAGE_CONFIGS[language].ignoreNodeTypes.includes(nodeType);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): readonly SupportedLanguage[] {
    return Object.keys(LANGUAGE_CONFIGS) as SupportedLanguage[];
  }

  /**
   * Check if a language is supported
   */
  isSupported(language: string): language is SupportedLanguage {
    return language in LANGUAGE_CONFIGS;
  }

  /**
   * Lazy-load a Tree-sitter parser for a language
   */
  async loadParser(language: SupportedLanguage): Promise<unknown> {
    if (this.loadedParsers.has(language)) {
      return this.loadedParsers.get(language);
    }

    const config = LANGUAGE_CONFIGS[language];

    try {
      // Dynamic import of Tree-sitter language module
      const languageModule = await import(config.moduleName);

      // Handle named exports (like TypeScript) vs default exports
      const parser = config.exportName
        ? languageModule[config.exportName]
        : languageModule.default || languageModule;

      if (!parser) {
        throw new Error(
          `Invalid language object: module does not export '${config.exportName || 'default'}'`
        );
      }

      this.loadedParsers.set(language, parser);
      return parser;
    } catch (error) {
      throw new Error(
        `Failed to load parser for ${language}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear loaded parsers (useful for testing)
   */
  clearCache(): void {
    this.loadedParsers.clear();
  }
}
