/**
 * Tests for the Code Generator
 */

import { describe, it, expect } from 'vitest';
import {
  generateCode,
  generateJSXString,
  generateInlineCSS,
  generateCSSClass,
  exportAsJSON,
} from './CodeGenerator.js';
import type { ComponentNode, NodeId } from '../types.js';

describe('CodeGenerator', () => {
  // Helper to create test nodes
  const createTestNodes = (): Record<NodeId, ComponentNode> => ({
    root: {
      id: 'root',
      type: 'Frame',
      name: 'Root',
      props: {},
      styles: {
        display: 'flex',
        flexDirection: 'column',
        padding: { value: 16, unit: 'px' },
      },
      children: ['button-1', 'text-1'],
      parentId: null,
      events: [],
    },
    'button-1': {
      id: 'button-1',
      type: 'Button',
      name: 'Submit Button',
      props: { label: 'Click me', disabled: false },
      styles: {
        backgroundColor: '#0066ff',
        color: '#ffffff',
        padding: { value: 12, unit: 'px' },
        borderRadius: { value: 6, unit: 'px' },
      },
      children: [],
      parentId: 'root',
      events: [{ event: 'onClick', handler: 'handleClick', modifiers: [] }],
    },
    'text-1': {
      id: 'text-1',
      type: 'Text',
      name: 'Description',
      props: { content: 'Hello World' },
      styles: {
        fontSize: { value: 16, unit: 'px' },
        color: '#333333',
      },
      children: [],
      parentId: 'root',
      events: [],
    },
  });

  describe('generateCode', () => {
    it('should generate valid TSX code', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        format: 'tsx',
        componentName: 'TestComponent',
      });

      expect(result.code).toContain('function TestComponent');
      expect(result.code).toContain('export default');
      expect(result.language).toBe('tsx');
      expect(result.filename).toBe('TestComponent.tsx');
    });

    it('should generate valid JSX code', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        format: 'jsx',
        componentName: 'MyComponent',
      });

      expect(result.code).toContain('function MyComponent');
      expect(result.language).toBe('jsx');
      expect(result.filename).toBe('MyComponent.jsx');
    });

    it('should include props interface for TSX', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        format: 'tsx',
        addPropsInterface: true,
        componentName: 'TestComponent',
      });

      expect(result.code).toContain('interface TestComponentProps');
    });

    it('should handle named exports', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        exportType: 'named',
        componentName: 'NamedComponent',
      });

      expect(result.code).toContain('export function NamedComponent');
      expect(result.code).not.toContain('export default');
    });

    it('should handle no exports', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        exportType: 'none',
        componentName: 'NoExportComponent',
      });

      expect(result.code).toContain('function NoExportComponent');
      expect(result.code).not.toContain('export default');
      expect(result.code).not.toContain('export function');
    });

    it('should use single quotes when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        quotes: 'single',
      });

      expect(result.code).toContain("'philjs-core'");
    });

    it('should use double quotes when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        quotes: 'double',
      });

      expect(result.code).toContain('"philjs-core"');
    });

    it('should include semicolons when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        semicolons: true,
      });

      expect(result.code).toContain(';');
    });

    it('should omit semicolons when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        semicolons: false,
        wrapInFunction: false,
      });

      // The main code should not end with semicolons
      expect(result.code).not.toMatch(/;\s*$/m);
    });

    it('should minify when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        minify: true,
        wrapInFunction: false,
      });

      // Minified code should not have newlines
      expect(result.code).not.toContain('\n\n');
    });

    it('should include component imports when specified', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        componentImports: true,
      });

      expect(result.imports.length).toBeGreaterThan(0);
    });

    it('should throw for non-existent root', () => {
      const nodes = createTestNodes();
      expect(() => generateCode(nodes, 'non-existent')).toThrow();
    });
  });

  describe('generateJSXString', () => {
    it('should generate raw JSX without wrapper', () => {
      const nodes = createTestNodes();
      const result = generateJSXString(nodes, 'root');

      expect(result).not.toContain('function');
      expect(result).not.toContain('export');
      expect(result).toContain('<');
      expect(result).toContain('>');
    });

    it('should handle nested components', () => {
      const nodes = createTestNodes();
      const result = generateJSXString(nodes, 'root');

      // Should contain nested elements (mapped to native HTML tags)
      expect(result).toContain('<button');
      expect(result).toContain('<span');
    });
  });

  describe('Style Formats', () => {
    it('should generate inline styles', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        styleFormat: 'inline',
        wrapInFunction: false,
      });

      // Inline styles use CSS property format
      expect(result.code).toContain('style=');
      expect(result.code).toMatch(/display:\s*flex/);
    });

    it('should generate object styles', () => {
      const nodes = createTestNodes();
      const result = generateCode(nodes, 'root', {
        styleFormat: 'object',
        wrapInFunction: false,
      });

      expect(result.code).toContain('style={');
    });

    it('should generate Tailwind classes', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Frame',
          props: {},
          styles: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          },
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateCode(nodes, 'root', {
        styleFormat: 'tailwind',
        wrapInFunction: false,
      });

      expect(result.code).toContain('className=');
      expect(result.code).toContain('flex');
      expect(result.code).toContain('flex-col');
      expect(result.code).toContain('items-center');
      expect(result.code).toContain('justify-center');
      expect(result.code).toContain('relative');
    });
  });

  describe('generateInlineCSS', () => {
    it('should convert styles to inline CSS', () => {
      const result = generateInlineCSS({
        display: 'flex',
        flexDirection: 'column',
        padding: { value: 16, unit: 'px' },
        margin: { value: 8, unit: 'rem' },
        width: { value: 100, unit: '%' },
      });

      expect(result).toContain('display: flex;');
      expect(result).toContain('flex-direction: column;');
      expect(result).toContain('padding: 16px;');
      expect(result).toContain('margin: 8rem;');
      expect(result).toContain('width: 100%;');
    });

    it('should handle auto and none units', () => {
      const result = generateInlineCSS({
        margin: { value: 0, unit: 'auto' },
        lineHeight: { value: 1.5, unit: 'none' },
      });

      expect(result).toContain('margin: auto;');
      expect(result).toContain('line-height: 1.5;');
    });

    it('should ignore undefined values', () => {
      const result = generateInlineCSS({
        display: 'flex',
        padding: undefined,
      });

      expect(result).toContain('display: flex;');
      expect(result).not.toContain('padding');
    });
  });

  describe('generateCSSClass', () => {
    it('should generate a CSS class definition', () => {
      const result = generateCSSClass('my-class', {
        display: 'flex',
        backgroundColor: '#ff0000',
        padding: { value: 16, unit: 'px' },
      });

      expect(result).toContain('.my-class {');
      expect(result).toContain('display: flex;');
      expect(result).toContain('background-color: #ff0000;');
      expect(result).toContain('padding: 16px;');
      expect(result).toContain('}');
    });
  });

  describe('exportAsJSON', () => {
    it('should export nodes as JSON', () => {
      const nodes = createTestNodes();
      const result = exportAsJSON(nodes, 'root');
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.rootId).toBe('root');
      expect(parsed.nodes).toBeDefined();
      expect(parsed.nodes['root']).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include metadata when provided', () => {
      const nodes = createTestNodes();
      const result = exportAsJSON(nodes, 'root', {
        author: 'Test User',
        project: 'My Project',
      });
      const parsed = JSON.parse(result);

      expect(parsed.metadata.author).toBe('Test User');
      expect(parsed.metadata.project).toBe('My Project');
    });
  });

  describe('Component Type Mapping', () => {
    it('should map component types to HTML tags when not using component imports', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Button',
          props: { label: 'Test' },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateCode(nodes, 'root', {
        componentImports: false,
        wrapInFunction: false,
      });

      expect(result.code).toContain('<button');
    });

    it('should use component names when using component imports', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Button',
          props: { label: 'Test' },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateCode(nodes, 'root', {
        componentImports: true,
        wrapInFunction: false,
      });

      expect(result.code).toContain('<Button');
    });
  });

  describe('Void Elements', () => {
    it('should self-close void elements', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Input',
          props: { placeholder: 'Enter text' },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      // Maps to native <input> tag which is self-closing
      expect(result).toMatch(/<input[^>]* \/>/);
    });
  });

  describe('Text Content', () => {
    it('should render text content for Text components', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Text',
          props: { content: 'Hello World' },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('Hello World');
    });
  });

  describe('Event Handlers', () => {
    it('should include event handlers', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Button',
          props: { label: 'Click' },
          styles: {},
          children: [],
          parentId: null,
          events: [
            { event: 'onClick', handler: 'handleClick', modifiers: [] },
            { event: 'onHover', handler: '() => console.log("hover")', modifiers: [] },
          ],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('onClick={handleClick}');
      expect(result).toContain('onHover=');
    });
  });

  describe('Props Handling', () => {
    it('should handle string props', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Input',
          props: { placeholder: 'Enter text' },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root', { quotes: 'single' });
      expect(result).toContain("placeholder='Enter text'");
    });

    it('should handle number props', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Slider',
          props: { min: 0, max: 100, value: 50 },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('min={0}');
      expect(result).toContain('max={100}');
      expect(result).toContain('value={50}');
    });

    it('should handle boolean props', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Button',
          props: { disabled: true, loading: false },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('disabled');
      expect(result).not.toContain('loading'); // false booleans are omitted
    });

    it('should handle array props', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Select',
          props: { options: ['Option 1', 'Option 2'] },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('options={');
    });

    it('should handle binding expressions', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Input',
          props: {
            value: { type: 'binding', expression: 'inputValue', mode: 'one-way' },
          },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('value={inputValue()}');
    });

    it('should handle two-way binding expressions', () => {
      const nodes: Record<NodeId, ComponentNode> = {
        root: {
          id: 'root',
          type: 'Input',
          props: {
            value: { type: 'binding', expression: 'inputValue', mode: 'two-way' },
          },
          styles: {},
          children: [],
          parentId: null,
          events: [],
        },
      };

      const result = generateJSXString(nodes, 'root');
      expect(result).toContain('value={inputValue}');
    });
  });
});
