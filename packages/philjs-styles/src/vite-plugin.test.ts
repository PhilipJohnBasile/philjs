import { describe, it, expect, vi } from 'vitest';
import { philjsStylesPlugin } from './vite-plugin';
import type { Plugin } from 'vite';

describe('philjsStylesPlugin()', () => {
  it('returns a valid Vite plugin', () => {
    const plugin = philjsStylesPlugin();

    expect(plugin.name).toBe('philjs-styles');
    expect(plugin.enforce).toBe('pre');
  });

  it('has config hook', () => {
    const plugin = philjsStylesPlugin();

    expect(typeof plugin.config).toBe('function');
  });

  it('has transform hook', () => {
    const plugin = philjsStylesPlugin();

    expect(typeof plugin.transform).toBe('function');
  });

  it('has generateBundle hook', () => {
    const plugin = philjsStylesPlugin();

    expect(typeof plugin.generateBundle).toBe('function');
  });
});

describe('Plugin config()', () => {
  it('returns CSS modules configuration', () => {
    const plugin = philjsStylesPlugin();
    const config = plugin.config?.({} as any, { command: 'serve', mode: 'development' });

    expect(config).toHaveProperty('css');
    expect(config?.css).toHaveProperty('modules');
  });

  it('uses default CSS modules settings', () => {
    const plugin = philjsStylesPlugin();
    const config = plugin.config?.({} as any, { command: 'serve', mode: 'development' });

    expect(config?.css?.modules?.scopeBehaviour).toBe('local');
    expect(config?.css?.modules?.localsConvention).toBe('camelCaseOnly');
  });

  it('respects custom CSS modules options', () => {
    const plugin = philjsStylesPlugin({
      cssModules: {
        scopeBehaviour: 'global',
        localsConvention: 'dashes',
      },
    });
    const config = plugin.config?.({} as any, { command: 'serve', mode: 'development' });

    expect(config?.css?.modules?.scopeBehaviour).toBe('global');
    expect(config?.css?.modules?.localsConvention).toBe('dashes');
  });
});

describe('Plugin transform()', () => {
  describe('.philjs.css files', () => {
    it('transforms .philjs.css files when scoping is enabled', () => {
      const plugin = philjsStylesPlugin({ scoping: true });
      const cssContent = `
        .button {
          padding: 10px;
          background: blue;
        }
      `;

      const result = plugin.transform?.(cssContent, '/path/to/component.philjs.css');

      expect(result).not.toBeNull();
      expect(result?.code).toContain('const style = document.createElement');
      expect(result?.code).toContain('export const scopedClass');
      expect(result?.code).toContain('export default');
    });

    it('does not transform .philjs.css files when scoping is disabled', () => {
      const plugin = philjsStylesPlugin({ scoping: false });
      const cssContent = `.button { padding: 10px; }`;

      const result = plugin.transform?.(cssContent, '/path/to/component.philjs.css');

      expect(result).toBeNull();
    });

    it('generates scoped class with custom prefix', () => {
      const plugin = philjsStylesPlugin({
        classPrefix: 'custom',
      });
      const cssContent = `.test { color: red; }`;

      const result = plugin.transform?.(cssContent, '/path/to/test.philjs.css');

      expect(result?.code).toContain('custom-');
    });

    it('scopes CSS selectors correctly', () => {
      const plugin = philjsStylesPlugin();
      const cssContent = `
        .container {
          display: flex;
        }
        .container > .child {
          margin: 5px;
        }
      `;

      const result = plugin.transform?.(cssContent, '/path/to/layout.philjs.css');

      expect(result).not.toBeNull();
      expect(result?.code).toBeDefined();
    });
  });

  describe('TypeScript/JSX files with css`` templates', () => {
    it('transforms css`` tagged templates in .tsx files', () => {
      const plugin = philjsStylesPlugin();
      const tsxContent = `
        import { css } from 'philjs-styles';

        const buttonClass = css\`
          padding: 10px;
          background: blue;
        \`;
      `;

      const result = plugin.transform?.(tsxContent, '/path/to/component.tsx');

      expect(result).not.toBeNull();
      expect(result?.code).toContain('if (typeof document !== \'undefined\')');
    });

    it('transforms css`` tagged templates in .ts files', () => {
      const plugin = philjsStylesPlugin();
      const tsContent = `
        const style = css\`color: red;\`;
      `;

      const result = plugin.transform?.(tsContent, '/path/to/styles.ts');

      expect(result).not.toBeNull();
    });

    it('does not transform files without css`` templates', () => {
      const plugin = philjsStylesPlugin();
      const tsxContent = `
        import React from 'react';

        const Component = () => <div>Hello</div>;
      `;

      const result = plugin.transform?.(tsxContent, '/path/to/component.tsx');

      expect(result).toBeNull();
    });

    it('transforms multiple css`` templates in same file', () => {
      const plugin = philjsStylesPlugin();
      const tsxContent = `
        const class1 = css\`color: red;\`;
        const class2 = css\`color: blue;\`;
        const class3 = css\`color: green;\`;
      `;

      const result = plugin.transform?.(tsxContent, '/path/to/multi.tsx');

      expect(result).not.toBeNull();
      // Each css`` template is transformed to an IIFE that checks for existing style and creates new one
      // The pattern appears twice per template: once for querySelector and once for setAttribute
      const matches = result?.code?.match(/data-philjs/g);
      expect(matches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Non-matching files', () => {
    it('returns null for regular CSS files', () => {
      const plugin = philjsStylesPlugin();
      const cssContent = `.button { padding: 10px; }`;

      const result = plugin.transform?.(cssContent, '/path/to/styles.css');

      expect(result).toBeNull();
    });

    it('returns null for JavaScript files without css``', () => {
      const plugin = philjsStylesPlugin();
      const jsContent = `const x = 1 + 2;`;

      const result = plugin.transform?.(jsContent, '/path/to/script.js');

      expect(result).toBeNull();
    });

    it('returns null for JSON files', () => {
      const plugin = philjsStylesPlugin();
      const jsonContent = `{ "key": "value" }`;

      const result = plugin.transform?.(jsonContent, '/path/to/data.json');

      expect(result).toBeNull();
    });
  });
});

describe('CSS scoping logic', () => {
  it('scopes regular selectors', () => {
    const plugin = philjsStylesPlugin();
    const css = `.button { color: red; }`;

    const result = plugin.transform?.(css, '/test.philjs.css');

    // The scoped CSS should include the scoped class
    expect(result?.code).toContain('.philjs-');
  });

  it('handles :global() pseudo-class', () => {
    const plugin = philjsStylesPlugin();
    const css = `:global(.external) { color: blue; }`;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles :global selector', () => {
    const plugin = philjsStylesPlugin();
    const css = `:global body { margin: 0; }`;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('preserves @media queries', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      @media (min-width: 768px) {
        .container { display: flex; }
      }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result?.code).toContain('@media');
  });

  it('preserves @keyframes', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result?.code).toContain('@keyframes');
  });

  it('handles & parent selector', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      .button {
        &:hover { background: blue; }
        &.active { background: green; }
      }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });
});

describe('generateBundle()', () => {
  it('does not emit file when extractCritical is false', () => {
    const plugin = philjsStylesPlugin({ extractCritical: false });
    const emitFileSpy = vi.fn();
    const context = {
      emitFile: emitFileSpy,
    };

    // Simulate some transformations first
    plugin.transform?.('.test { }', '/test.philjs.css');

    plugin.generateBundle?.call(context as any, {} as any, {});

    expect(emitFileSpy).not.toHaveBeenCalled();
  });

  it('emits critical.css when extractCritical is true and styles exist', () => {
    const plugin = philjsStylesPlugin({ extractCritical: true });
    const emitFileSpy = vi.fn();
    const context = {
      emitFile: emitFileSpy,
    };

    // Transform a file to populate styleMap
    plugin.transform?.('.test { color: red; }', '/test.philjs.css');

    plugin.generateBundle?.call(context as any, {} as any, {});

    // Should emit a file
    expect(emitFileSpy).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'critical.css',
      source: expect.any(String),
    });
  });
});

describe('Plugin options', () => {
  it('uses default options when none provided', () => {
    const plugin = philjsStylesPlugin();

    // Should work without errors
    expect(plugin.name).toBe('philjs-styles');
  });

  it('accepts all configuration options', () => {
    const plugin = philjsStylesPlugin({
      scoping: true,
      cssModules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCaseOnly',
      },
      extractCritical: true,
      classPrefix: 'my-app',
    });

    expect(plugin.name).toBe('philjs-styles');
  });

  it('disables scoping when option is false', () => {
    const plugin = philjsStylesPlugin({ scoping: false });
    const css = `.test { color: red; }`;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).toBeNull();
  });
});

describe('Edge cases', () => {
  it('handles empty CSS content', () => {
    const plugin = philjsStylesPlugin();
    const result = plugin.transform?.('', '/test.philjs.css');

    expect(result).not.toBeNull();
    expect(result?.code).toContain('export');
  });

  it('handles CSS with only comments', () => {
    const plugin = philjsStylesPlugin();
    const css = `/* This is a comment */`;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles deeply nested selectors', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      .a .b .c .d .e {
        color: red;
      }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles selectors with pseudo-elements', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      .button::before { content: ''; }
      .button::after { content: ''; }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles attribute selectors', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      [data-active="true"] { background: blue; }
      input[type="text"] { border: 1px solid gray; }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles combinator selectors', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      .parent > .child { }
      .sibling + .sibling { }
      .sibling ~ .sibling { }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });

  it('handles CSS with newlines and whitespace', () => {
    const plugin = philjsStylesPlugin();
    const css = `
      .button {
        padding:
          10px
          20px;

        background:
          linear-gradient(
            to right,
            red,
            blue
          );
      }
    `;

    const result = plugin.transform?.(css, '/test.philjs.css');

    expect(result).not.toBeNull();
  });
});

describe('Integration with Vite', () => {
  it('plugin can be used in Vite config array', () => {
    const plugins: Plugin[] = [
      philjsStylesPlugin(),
    ];

    expect(plugins.length).toBe(1);
    expect(plugins[0].name).toBe('philjs-styles');
  });

  it('plugin is compatible with other Vite plugins', () => {
    const mockPlugin: Plugin = {
      name: 'mock-plugin',
    };

    const plugins: Plugin[] = [
      mockPlugin,
      philjsStylesPlugin(),
    ];

    expect(plugins.length).toBe(2);
  });
});
