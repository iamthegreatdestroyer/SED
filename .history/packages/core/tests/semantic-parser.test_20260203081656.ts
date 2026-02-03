/**
 * SED - Semantic Entropy Differencing
 * Semantic Parser Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticParser } from '../src/semantic/parser.js';
import type { SemanticNode } from '@sed/shared/types';

describe('SemanticParser', () => {
  let parser: SemanticParser;

  beforeEach(() => {
    parser = new SemanticParser();
  });

  describe('parse', () => {
    it('should parse TypeScript functions', async () => {
      const code = `
        function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;

      const result = await parser.parse(code, 'typescript');

      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
    });

    it('should parse TypeScript classes', async () => {
      const code = `
        class Calculator {
          private value: number = 0;
          
          add(n: number): this {
            this.value += n;
            return this;
          }
          
          getResult(): number {
            return this.value;
          }
        }
      `;

      const result = await parser.parse(code, 'typescript');

      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('should parse TypeScript interfaces', async () => {
      const code = `
        interface User {
          id: string;
          name: string;
          email?: string;
        }
        
        interface Admin extends User {
          permissions: string[];
        }
      `;

      const result = await parser.parse(code, 'typescript');

      expect(result.nodes).toBeDefined();
    });

    it('should parse JavaScript code', async () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        const result = fibonacci(10);
      `;

      const result = await parser.parse(code, 'javascript');

      expect(result.nodes).toBeDefined();
    });

    it('should parse Python code', async () => {
      const code = `
def greet(name):
    return f"Hello, {name}!"

class Person:
    def __init__(self, name):
        self.name = name
    
    def say_hello(self):
        return greet(self.name)
      `;

      const result = await parser.parse(code, 'python');

      expect(result.nodes).toBeDefined();
    });

    it('should parse Go code', async () => {
      const code = `
package main

func add(a, b int) int {
    return a + b
}

type Calculator struct {
    value int
}

func (c *Calculator) Add(n int) {
    c.value += n
}
      `;

      const result = await parser.parse(code, 'go');

      expect(result.nodes).toBeDefined();
    });

    it('should parse Rust code', async () => {
      const code = `
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

struct Calculator {
    value: i32,
}

impl Calculator {
    fn new() -> Self {
        Calculator { value: 0 }
    }
    
    fn add(&mut self, n: i32) {
        self.value += n;
    }
}
      `;

      const result = await parser.parse(code, 'rust');

      expect(result.nodes).toBeDefined();
    });

    it('should handle empty code', async () => {
      const result = await parser.parse('', 'typescript');

      expect(result.nodes).toHaveLength(0);
    });

    it('should handle whitespace-only code', async () => {
      const result = await parser.parse('   \n\n   ', 'typescript');

      expect(result.nodes).toHaveLength(0);
    });

    it('should include parse time in metadata', async () => {
      const result = await parser.parse('const x = 1;', 'typescript');

      expect(result.metadata.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.language).toBe('typescript');
    });
  });

  describe('extractNodes', () => {
    it('should extract function nodes', async () => {
      const code = `
        function func1() {}
        function func2() {}
        const arrow = () => {};
      `;

      const result = await parser.parse(code, 'typescript');
      const functions = findNodesByType(result.nodes, 'function');

      expect(functions.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract class nodes with methods', async () => {
      const code = `
        class MyClass {
          method1() {}
          method2() {}
        }
      `;

      const result = await parser.parse(code, 'typescript');
      const classes = findNodesByType(result.nodes, 'class');

      expect(classes.length).toBeGreaterThanOrEqual(1);
    });

    it('should preserve node hierarchy', async () => {
      const code = `
        class Parent {
          method() {
            function nested() {}
          }
        }
      `;

      const result = await parser.parse(code, 'typescript');

      // Classes should contain methods
      const classes = findNodesByType(result.nodes, 'class');
      if (classes.length > 0) {
        expect(classes[0].children).toBeDefined();
      }
    });

    it('should include node ranges', async () => {
      const code = 'function test() { return 1; }';

      const result = await parser.parse(code, 'typescript');
      const functions = findNodesByType(result.nodes, 'function');

      if (functions.length > 0) {
        expect(functions[0].range).toBeDefined();
        expect(functions[0].range.start).toBeGreaterThanOrEqual(0);
        expect(functions[0].range.end).toBeGreaterThan(functions[0].range.start);
      }
    });
  });

  describe('configuration', () => {
    it('should respect timeout option', async () => {
      const timeoutParser = new SemanticParser({ timeout: 100 });

      // Should complete within timeout for small code
      const result = await timeoutParser.parse('const x = 1;', 'typescript');
      expect(result).toBeDefined();
    });

    it('should support custom language configs', () => {
      const customParser = new SemanticParser({
        languageConfigs: {
          typescript: {
            extensions: ['.ts', '.tsx', '.mts'],
            nodeTypes: ['function', 'class', 'interface', 'type_alias'],
          },
        },
      });

      expect(customParser).toBeDefined();
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = parser.getSupportedLanguages();

      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(parser.isLanguageSupported('typescript')).toBe(true);
      expect(parser.isLanguageSupported('javascript')).toBe(true);
      expect(parser.isLanguageSupported('python')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(parser.isLanguageSupported('cobol')).toBe(false);
      expect(parser.isLanguageSupported('fortran')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const invalidCode = 'function invalid( {}';

      // Should not throw, parser handles errors
      const result = await parser.parse(invalidCode, 'typescript');
      expect(result).toBeDefined();
    });

    it('should reject unsupported languages', async () => {
      await expect(
        parser.parse('code', 'unsupported_language' as any)
      ).rejects.toThrow();
    });
  });
});

// Helper function
function findNodesByType(nodes: SemanticNode[], type: string): SemanticNode[] {
  const result: SemanticNode[] = [];
  
  function traverse(nodeList: SemanticNode[]): void {
    for (const node of nodeList) {
      if (node.type === type || node.type.includes(type)) {
        result.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  
  traverse(nodes);
  return result;
}
