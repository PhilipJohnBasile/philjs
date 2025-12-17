/**
 * Tests for PhilJS Compiler
 *
 * Validates the main compiler API functions
 */

import { describe, it, expect } from 'vitest';
import {
  createCompiler,
  transform,
  analyzeCode,
  validateConfig,
  getDefaultConfig,
  version
} from './index';

describe('PhilJS Compiler', () => {
  describe('createCompiler', () => {
    it('should create a compiler instance with default config', () => {
      const compiler = createCompiler();
      expect(compiler).toBeDefined();
      expect(typeof compiler.optimize).toBe('function');
    });

    it('should create a compiler instance with custom config', () => {
      const compiler = createCompiler({
        autoMemo: false,
        autoBatch: true
      });
      expect(compiler).toBeDefined();
    });
  });

  describe('transform', () => {
    it('should transform code with signal imports', () => {
      const code = `
        import { signal, memo } from 'philjs-core';

        const count = signal(0);
        const doubled = count() * 2;
      `;

      const result = transform(code, 'test.ts', { autoMemo: true });

      expect(result.code).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(Array.isArray(result.optimizations)).toBe(true);
    });

    it('should return original code for non-PhilJS files', () => {
      const code = `
        const foo = 'bar';
        console.log(foo);
      `;

      const result = transform(code, 'test.ts');

      // Should return code as-is since there are no PhilJS imports
      expect(result.code).toBeDefined();
      expect(result.optimizations.length).toBe(0);
    });

    it('should generate source maps when enabled', () => {
      const code = `
        import { signal } from 'philjs-core';
        const count = signal(0);
      `;

      const result = transform(code, 'test.ts', { sourceMaps: true });

      expect(result.map).toBeDefined();
    });

    it('should not generate source maps when disabled', () => {
      const code = `
        import { signal } from 'philjs-core';
        const count = signal(0);
      `;

      const result = transform(code, 'test.ts', { sourceMaps: false });

      expect(result.map).toBeUndefined();
    });
  });

  describe('analyzeCode', () => {
    it('should analyze PhilJS code', () => {
      const code = `
        import { signal, memo, effect } from 'philjs-core';

        function Counter() {
          const count = signal(0);
          const doubled = memo(() => count() * 2);

          effect(() => {
            console.log('Count:', count());
          });

          return <div>{doubled()}</div>;
        }
      `;

      const analysis = analyzeCode(code, 'test.tsx');

      expect(analysis).toBeDefined();
      expect(analysis.filePath).toBe('test.tsx');
      expect(analysis.imports).toBeDefined();
      expect(analysis.reactiveBindings).toBeDefined();
      expect(analysis.components).toBeDefined();
      expect(analysis.optimizationOpportunities).toBeDefined();
      expect(Array.isArray(analysis.optimizationOpportunities)).toBe(true);
    });

    it('should detect PhilJS imports', () => {
      const code = `
        import { signal, memo, effect, batch } from 'philjs-core';
      `;

      const analysis = analyzeCode(code, 'test.ts');

      expect(analysis.imports.signal).toBe(true);
      expect(analysis.imports.memo).toBe(true);
      expect(analysis.imports.effect).toBe(true);
      expect(analysis.imports.batch).toBe(true);
    });

    it('should detect components', () => {
      const code = `
        import { signal } from 'philjs-core';

        function MyComponent() {
          return <div>Hello</div>;
        }

        const AnotherComponent = () => {
          return <span>World</span>;
        };
      `;

      const analysis = analyzeCode(code, 'test.tsx');

      expect(analysis.components.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const errors = validateConfig({
        autoMemo: true,
        autoBatch: true,
        include: ['**/*.tsx'],
        exclude: ['**/node_modules/**']
      });

      expect(errors.length).toBe(0);
    });

    it('should detect invalid include patterns', () => {
      const errors = validateConfig({
        include: [123 as any] // Invalid: not a string
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('include pattern');
    });

    it('should detect invalid exclude patterns', () => {
      const errors = validateConfig({
        exclude: [null as any] // Invalid: not a string
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exclude pattern');
    });

    it('should detect invalid plugins', () => {
      const errors = validateConfig({
        plugins: [
          { name: 'test', transform: 'not-a-function' as any }
        ]
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('transform');
    });

    it('should detect plugins without name', () => {
      const errors = validateConfig({
        plugins: [
          { transform: () => {} } as any
        ]
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('name');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', () => {
      const config = getDefaultConfig();

      expect(config.autoMemo).toBe(true);
      expect(config.autoBatch).toBe(true);
      expect(config.deadCodeElimination).toBe(true);
      expect(config.optimizeEffects).toBe(true);
      expect(config.optimizeComponents).toBe(true);
      expect(config.sourceMaps).toBe(true);
      expect(config.development).toBe(false);
    });

    it('should merge overrides with defaults', () => {
      const config = getDefaultConfig({
        autoMemo: false,
        development: true
      });

      expect(config.autoMemo).toBe(false);
      expect(config.development).toBe(true);
      expect(config.autoBatch).toBe(true); // Still default
    });

    it('should merge include/exclude arrays', () => {
      const config = getDefaultConfig({
        include: ['**/*.custom.ts'],
        exclude: ['**/build/**']
      });

      expect(config.include).toEqual(['**/*.custom.ts']);
      expect(config.exclude).toEqual(['**/build/**']);
    });

    it('should merge plugins arrays', () => {
      const customPlugin = { name: 'custom', transform: () => {} };
      const config = getDefaultConfig({
        plugins: [customPlugin]
      });

      expect(config.plugins).toContain(customPlugin);
    });
  });

  describe('version', () => {
    it('should export version string', () => {
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('integration', () => {
    it('should handle real-world PhilJS component', () => {
      const code = `
        import { signal, memo, effect } from 'philjs-core';

        export function TodoList() {
          const todos = signal([
            { id: 1, text: 'Learn PhilJS', done: false },
            { id: 2, text: 'Build app', done: false }
          ]);

          const completedCount = memo(() =>
            todos().filter(t => t.done).length
          );

          effect(() => {
            console.log('Completed:', completedCount());
          });

          const toggleTodo = (id: number) => {
            todos.set(todos().map(t =>
              t.id === id ? { ...t, done: !t.done } : t
            ));
          };

          return (
            <div>
              <h1>Todos ({completedCount()} / {todos().length})</h1>
              <ul>
                {todos().map(todo => (
                  <li key={todo.id}>
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                    />
                    {todo.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      `;

      const result = transform(code, 'TodoList.tsx', {
        autoMemo: true,
        autoBatch: true,
        sourceMaps: true
      });

      expect(result.code).toBeDefined();
      expect(result.map).toBeDefined();
      expect(result.optimizations).toBeDefined();

      // Verify code is still valid (should parse)
      expect(() => {
        new Function(result.code);
      }).not.toThrow();
    });
  });
});
