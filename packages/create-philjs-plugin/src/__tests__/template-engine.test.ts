/**
 * Tests for template engine utilities
 */

import { describe, it, expect } from 'vitest';
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  createContext,
  generateImports,
  generateConfigInterface,
  generateTestTemplate,
} from '../template-engine.js';

describe('Template Engine', () => {
  describe('Case Conversion', () => {
    it('should convert to PascalCase', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
      expect(toPascalCase('hello world')).toBe('HelloWorld');
      expect(toPascalCase('philjs-plugin-awesome')).toBe('PhilJsPluginAwesome');
    });

    it('should convert to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello_world')).toBe('helloWorld');
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });

    it('should convert to kebab-case', () => {
      expect(toKebabCase('HelloWorld')).toBe('hello-world');
      expect(toKebabCase('helloWorld')).toBe('hello-world');
      expect(toKebabCase('hello_world')).toBe('hello-world');
    });
  });

  describe('Context Creation', () => {
    it('should create context with defaults', () => {
      const context = createContext('philjs-plugin-test');

      expect(context.pluginName).toBe('philjs-plugin-test');
      expect(context.pascalName).toBe('Test');
      expect(context.camelName).toBe('test');
      expect(context.kebabName).toBe('test');
      expect(context.typescript).toBe(true);
      expect(context.testing).toBe(true);
    });

    it('should create context with custom options', () => {
      const context = createContext('philjs-plugin-awesome', {
        description: 'An awesome plugin',
        author: 'Test Author',
        license: 'MIT',
        typescript: false,
        testing: false,
        features: ['config', 'cli'],
        type: 'vite',
      });

      expect(context.description).toBe('An awesome plugin');
      expect(context.author).toBe('Test Author');
      expect(context.license).toBe('MIT');
      expect(context.typescript).toBe(false);
      expect(context.testing).toBe(false);
      expect(context.features).toEqual(['config', 'cli']);
      expect(context.type).toBe('vite');
    });

    it('should handle plugin name without prefix', () => {
      const context = createContext('test');

      expect(context.pluginName).toBe('test');
      expect(context.pascalName).toBe('Test');
    });
  });

  describe('Import Generation', () => {
    it('should generate basic imports', () => {
      const imports = generateImports([], true);

      expect(imports).toContain('import type { Plugin, PluginContext }');
    });

    it('should generate vite imports', () => {
      const imports = generateImports(['vite', 'virtual-modules'], true);

      expect(imports).toContain('Plugin as VitePlugin');
    });

    it('should generate AST imports', () => {
      const imports = generateImports(['ast'], true);

      expect(imports).toContain('@babel/core');
      expect(imports).toContain('@babel/types');
    });

    it('should generate sourcemap imports', () => {
      const imports = generateImports(['sourcemaps'], true);

      expect(imports).toContain('SourceMapGenerator');
    });

    it('should generate React imports', () => {
      const imports = generateImports(['react'], true);

      expect(imports).toContain('React');
    });
  });

  describe('Config Interface Generation', () => {
    it('should generate basic config interface', () => {
      const context = createContext('test', {
        features: [],
      });

      const configInterface = generateConfigInterface(context);

      expect(configInterface).toContain('interface TestConfig');
      expect(configInterface).toContain('enabled?: boolean');
    });

    it('should include feature-specific options', () => {
      const context = createContext('test', {
        features: ['config', 'virtual-modules', 'theme'],
      });

      const configInterface = generateConfigInterface(context);

      expect(configInterface).toContain('config?: Record<string, any>');
      expect(configInterface).toContain('virtualModules?:');
      expect(configInterface).toContain('theme?:');
    });
  });

  describe('Test Template Generation', () => {
    it('should generate test template', () => {
      const context = createContext('philjs-plugin-test', {
        description: 'Test plugin',
      });

      const testTemplate = generateTestTemplate(context);

      expect(testTemplate).toContain("import { describe, it, expect");
      expect(testTemplate).toContain("describe('philjs-plugin-test'");
      expect(testTemplate).toContain('should have correct metadata');
      expect(testTemplate).toContain('should initialize successfully');
      expect(testTemplate).toContain('should handle build lifecycle');
    });

    it('should use correct plugin name in tests', () => {
      const context = createContext('philjs-plugin-awesome');

      const testTemplate = generateTestTemplate(context);

      expect(testTemplate).toContain("describe('philjs-plugin-awesome'");
      expect(testTemplate).toContain("expect(plugin.meta.name).toBe('philjs-plugin-awesome')");
    });
  });
});
