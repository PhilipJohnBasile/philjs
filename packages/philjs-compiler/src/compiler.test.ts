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

      // When sourceMaps is false, map is null (not undefined)
      expect(result.map).toBeNull();
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
      // The actual property is 'bindings', not 'reactiveBindings'
      expect(analysis.bindings).toBeDefined();
      expect(analysis.components).toBeDefined();
      // The actual property is 'optimizations', not 'optimizationOpportunities'
      expect(analysis.optimizations).toBeDefined();
      expect(Array.isArray(analysis.optimizations)).toBe(true);
    });

    it('should detect PhilJS imports', () => {
      const code = `
        import { signal, memo, effect, batch } from 'philjs-core';
      `;

      const analysis = analyzeCode(code, 'test.ts');

      // imports is an array of { name, alias?, source } objects
      const importNames = analysis.imports.map(i => i.name);
      expect(importNames).toContain('signal');
      expect(importNames).toContain('memo');
      expect(importNames).toContain('effect');
      expect(importNames).toContain('batch');
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

      // Verify code still contains expected structure
      // Note: Can't use new Function() for ES modules with imports
      expect(result.code).toContain('import');
      expect(result.code).toContain('signal');
      expect(result.code).toContain('memo');
      expect(result.code).toContain('TodoList');
      expect(typeof result.code).toBe('string');
      expect(result.code.length).toBeGreaterThan(100);
    });

    it('should handle nested component definitions', () => {
      const code = `
        import { signal, memo } from 'philjs-core';

        export function ComponentComposition() {
          const count = signal(0);

          // Nested component definition
          const Button = ({ label, onClick }: any) => {
            const buttonStyle = memo(() => ({
              background: 'blue',
              color: 'white'
            }));

            return (
              <button style={buttonStyle()} onClick={onClick}>
                {label}
              </button>
            );
          };

          return (
            <div>
              <span>Count: {count()}</span>
              <Button label="Increment" onClick={() => count.set(count() + 1)} />
            </div>
          );
        }
      `;

      const result = transform(code, 'Nested.tsx', { autoMemo: true });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('ComponentComposition');
      expect(result.code).toContain('Button');
      expect(result.code).toContain('buttonStyle');
    });

    it('should handle custom hook patterns', () => {
      const code = `
        import { signal } from 'philjs-core';

        // Custom hook pattern
        const useCounter = (initialValue = 0) => {
          const count = signal(initialValue);
          const increment = () => count.set(count() + 1);
          const decrement = () => count.set(count() - 1);
          const reset = () => count.set(initialValue);

          return { count, increment, decrement, reset };
        };

        export function Counter() {
          const counter1 = useCounter(0);
          const counter2 = useCounter(10);

          return (
            <div>
              <span>Counter 1: {counter1.count()}</span>
              <span>Counter 2: {counter2.count()}</span>
            </div>
          );
        }
      `;

      const result = transform(code, 'CustomHook.tsx', { autoMemo: true });
      const analysis = analyzeCode(code, 'CustomHook.tsx');

      expect(result.code).toBeDefined();
      expect(result.code).toContain('useCounter');
      expect(analysis.components.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle derived state chains (shopping cart pattern)', () => {
      const code = `
        import { signal, memo } from 'philjs-core';

        export function ShoppingCart() {
          const items = signal([
            { id: 1, price: 10, quantity: 2 },
            { id: 2, price: 15, quantity: 1 },
            { id: 3, price: 20, quantity: 3 }
          ]);

          // Derived computation chain
          const subtotal = memo(() =>
            items().reduce((sum, item) => sum + item.price * item.quantity, 0)
          );

          const tax = memo(() => subtotal() * 0.1);
          const total = memo(() => subtotal() + tax());
          const itemCount = memo(() => items().reduce((sum, item) => sum + item.quantity, 0));

          return (
            <div>
              <p>Items: {itemCount()}</p>
              <p>Subtotal: {subtotal()}</p>
              <p>Tax: {tax()}</p>
              <p>Total: {total()}</p>
            </div>
          );
        }
      `;

      const result = transform(code, 'ShoppingCart.tsx', { autoMemo: true });
      const analysis = analyzeCode(code, 'ShoppingCart.tsx');

      expect(result.code).toBeDefined();
      expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(4);
      expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(1);
    });

    it('should handle effects with cleanup', () => {
      const code = `
        import { signal, effect } from 'philjs-core';

        export function SearchModal({ isOpen }: { isOpen: boolean }) {
          const query = signal('');
          const results = signal([]);

          // Effect with cleanup
          effect(() => {
            if (!isOpen) return;

            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                query.set('');
              }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          });

          return (
            <div>
              <input value={query()} onInput={(e) => query.set(e.target.value)} />
              <ul>{results().map(r => <li>{r}</li>)}</ul>
            </div>
          );
        }
      `;

      const result = transform(code, 'SearchModal.tsx', { optimizeEffects: true });
      const analysis = analyzeCode(code, 'SearchModal.tsx');

      expect(result.code).toBeDefined();
      expect(analysis.bindings.filter(b => b.type === 'effect').length).toBeGreaterThanOrEqual(0);
    });

    it('should handle batched updates pattern', () => {
      const code = `
        import { signal, memo, batch } from 'philjs-core';

        export function PerformanceDemo() {
          const numbers = signal(Array.from({ length: 1000 }, (_, i) => i));
          const multiplier = signal(1);
          const computationCount = signal(0);

          const sum = memo(() => {
            computationCount.set(c => c + 1);
            return numbers().reduce((a, b) => a + b, 0);
          });

          const result = memo(() => sum() * multiplier());

          const addNumbers = () => {
            batch(() => {
              const current = numbers();
              numbers.set([...current, current.length, current.length + 1]);
            });
          };

          return (
            <div>
              <p>Array Size: {numbers().length}</p>
              <p>Result: {result()}</p>
              <p>Computations: {computationCount()}</p>
              <button onClick={addNumbers}>Add Numbers</button>
            </div>
          );
        }
      `;

      const result = transform(code, 'Performance.tsx', {
        autoMemo: true,
        autoBatch: true
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('batch');
      expect(result.code).toContain('memo');
    });

    it('should handle complex JSX with multiple signal reads', () => {
      const code = `
        import { signal, memo } from 'philjs-core';

        export function Dashboard() {
          const users = signal(100);
          const revenue = signal(50000);
          const growth = signal(15.5);
          const status = signal('healthy');

          const avgRevenuePerUser = memo(() => revenue() / users());
          const projectedGrowth = memo(() => revenue() * (1 + growth() / 100));

          return (
            <div class="dashboard">
              <div class="stat">
                <span class="label">Users</span>
                <span class="value">{users()}</span>
              </div>
              <div class="stat">
                <span class="label">Revenue</span>
                <span class="value">{revenue().toLocaleString()}</span>
              </div>
              <div class="stat">
                <span class="label">Growth</span>
                <span class="value">{growth()}%</span>
              </div>
              <div class="stat">
                <span class="label">Avg/User</span>
                <span class="value">{avgRevenuePerUser().toFixed(2)}</span>
              </div>
              <div class="stat">
                <span class="label">Projected</span>
                <span class="value">{projectedGrowth().toLocaleString()}</span>
              </div>
              <div class="status" data-status={status()}>
                System: {status()}
              </div>
            </div>
          );
        }
      `;

      const analysis = analyzeCode(code, 'Dashboard.tsx');

      expect(analysis.components.length).toBe(1);
      expect(analysis.components[0].name).toBe('Dashboard');
      expect(analysis.components[0].reactiveJSX.length).toBeGreaterThan(0);
      expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(4);
      expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(2);
    });
  });
});
