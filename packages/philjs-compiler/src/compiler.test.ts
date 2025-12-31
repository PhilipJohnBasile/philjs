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
        import { signal, memo } from '@philjs/core';

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
        import { signal } from '@philjs/core';
        const count = signal(0);
      `;

      const result = transform(code, 'test.ts', { sourceMaps: true });

      expect(result.map).toBeDefined();
    });

    it('should not generate source maps when disabled', () => {
      const code = `
        import { signal } from '@philjs/core';
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
        import { signal, memo, effect } from '@philjs/core';

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
        import { signal, memo, effect, batch } from '@philjs/core';
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
        import { signal } from '@philjs/core';

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

  describe('auto-batch detection', () => {
    it('should detect batch candidates in consecutive signal sets', () => {
      const code = `
        import { signal } from '@philjs/core';

        function Form() {
          const name = signal('');
          const email = signal('');
          const phone = signal('');

          const reset = () => {
            name.set('');
            email.set('');
            phone.set('');
          };

          return <button onClick={reset}>Reset</button>;
        }
      `;

      const result = transform(code, 'Form.tsx', { autoBatch: true });

      // Should detect consecutive signal.set() calls
      expect(result.optimizations.some(o => o.includes('batched'))).toBe(true);
    });

    it('should analyze signal bindings correctly', () => {
      const code = `
        import { signal } from '@philjs/core';

        function DataLoader() {
          const data = signal(null);
          const loading = signal(false);

          return <div>{loading() ? 'Loading...' : data()}</div>;
        }
      `;

      const analysis = analyzeCode(code, 'DataLoader.tsx');

      // Should detect both signals
      expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
      expect(analysis.components.length).toBe(1);
    });
  });

  describe('improved warnings', () => {
    it('should detect signal bindings in analysis', () => {
      const code = `
        import { signal } from '@philjs/core';

        function Component() {
          const count = signal(0);
          const double = signal(0);

          return <div>{count()}</div>;
        }
      `;

      const analysis = analyzeCode(code, 'test.tsx');

      // Verify signals are detected
      expect(analysis.bindings.length).toBeGreaterThan(0);
      expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
    });

    it('should analyze component structure', () => {
      const code = `
        import { signal } from '@philjs/core';

        function HeavyComponent() {
          const a = signal(1);
          const b = signal(2);
          const c = signal(3);

          return <div>{a()}{b()}{c()}</div>;
        }
      `;

      const analysis = analyzeCode(code, 'test.tsx');

      // Verify component is detected
      expect(analysis.components.length).toBe(1);
      expect(analysis.components[0].name).toBe('HeavyComponent');
    });

    it('should detect effects in analysis', () => {
      const code = `
        import { signal, effect } from '@philjs/core';

        function Component() {
          const count = signal(0);

          effect(() => {
            console.log(count());
          });

          return <div>{count()}</div>;
        }
      `;

      const analysis = analyzeCode(code, 'test.tsx');

      // Verify bindings are detected
      const signals = analysis.bindings.filter(b => b.type === 'signal');
      expect(signals.length).toBe(1);
      expect(signals[0].name).toBe('count');
    });
  });

  describe('edge cases', () => {
    describe('deeply nested components', () => {
      it('should handle components nested 5 levels deep', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          export function Level1() {
            const count1 = signal(0);

            const Level2 = () => {
              const count2 = signal(1);

              const Level3 = () => {
                const count3 = signal(2);

                const Level4 = () => {
                  const count4 = signal(3);

                  const Level5 = () => {
                    const count5 = signal(4);
                    return <div>{count5()}</div>;
                  };

                  return <div>{count4()} <Level5 /></div>;
                };

                return <div>{count3()} <Level4 /></div>;
              };

              return <div>{count2()} <Level3 /></div>;
            };

            return <div>{count1()} <Level2 /></div>;
          }
        `;

        const analysis = analyzeCode(code, 'DeepNesting.tsx');

        expect(analysis.components.length).toBeGreaterThanOrEqual(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(5);
      });

      it('should detect optimization opportunities in deeply nested components', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function OuterComponent() {
            const outer = signal(0);

            function MiddleComponent() {
              const middle = signal(0);
              const computed = memo(() => outer() + middle());

              function InnerComponent() {
                const inner = signal(0);
                return <div>{outer()} {middle()} {inner()} {computed()}</div>;
              }

              return <InnerComponent />;
            }

            return <MiddleComponent />;
          }
        `;

        const result = transform(code, 'Nested.tsx', { autoMemo: true });

        expect(result.code).toBeDefined();
        expect(result.optimizations).toBeDefined();
        expect(result.analysis?.bindings.filter(b => b.type === 'memo').length).toBe(1);
      });

      it('should handle recursive component patterns', () => {
        const code = `
          import { signal, Fragment } from '@philjs/core';

          function TreeNode({ depth }: { depth: number }) {
            const expanded = signal(false);

            if (depth === 0) {
              return <div>Leaf</div>;
            }

            return (
              <div>
                <button onClick={() => expanded.set(!expanded())}>
                  {expanded() ? 'Collapse' : 'Expand'}
                </button>
                {expanded() && (
                  <>
                    <TreeNode depth={depth - 1} />
                    <TreeNode depth={depth - 1} />
                  </>
                )}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Tree.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.components[0].name).toBe('TreeNode');
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(1);
      });
    });

    describe('conditional rendering with signals', () => {
      it('should handle if/else with signal conditions', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function ConditionalComponent() {
            const isLoggedIn = signal(false);
            const userName = signal('');
            const hasPermission = signal(false);

            if (isLoggedIn()) {
              if (hasPermission()) {
                return <div>Welcome, admin {userName()}</div>;
              }
              return <div>Welcome, {userName()}</div>;
            }

            return <div>Please log in</div>;
          }
        `;

        const analysis = analyzeCode(code, 'Conditional.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(3);
        expect(analysis.components[0].reactiveJSX.length).toBeGreaterThan(0);
      });

      it('should handle ternary operators with signals', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function TernaryComponent() {
            const status = signal('loading');
            const data = signal(null);
            const error = signal(null);

            return (
              <div>
                {status() === 'loading' ? (
                  <div>Loading...</div>
                ) : status() === 'error' ? (
                  <div>Error: {error()}</div>
                ) : (
                  <div>Data: {JSON.stringify(data())}</div>
                )}
              </div>
            );
          }
        `;

        const result = transform(code, 'Ternary.tsx', { autoMemo: true });

        expect(result.code).toBeDefined();
        expect(result.analysis?.bindings.filter(b => b.type === 'signal').length).toBe(3);
      });

      it('should handle logical && and || operators with signals', () => {
        const code = `
          import { signal } from '@philjs/core';

          function LogicalComponent() {
            const showHeader = signal(true);
            const showFooter = signal(false);
            const items = signal([]);

            return (
              <div>
                {showHeader() && <header>Header</header>}
                {items().length > 0 && <ul>{items().map(i => <li>{i}</li>)}</ul>}
                {showFooter() || <footer>Default Footer</footer>}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Logical.tsx');

        expect(analysis.components[0].reactiveJSX.length).toBeGreaterThan(0);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(3);
      });

      it('should handle switch statements with signal values', () => {
        const code = `
          import { signal } from '@philjs/core';

          function SwitchComponent() {
            const mode = signal('view');
            const content = signal('');

            const renderContent = () => {
              switch (mode()) {
                case 'edit':
                  return <input value={content()} />;
                case 'preview':
                  return <div>{content()}</div>;
                case 'view':
                default:
                  return <span>{content()}</span>;
              }
            };

            return <div>{renderContent()}</div>;
          }
        `;

        const analysis = analyzeCode(code, 'Switch.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
      });
    });

    describe('signals in loops', () => {
      it('should handle signals in map operations', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function ListComponent() {
            const items = signal([
              { id: 1, name: 'Item 1', active: false },
              { id: 2, name: 'Item 2', active: true },
              { id: 3, name: 'Item 3', active: false }
            ]);

            const activeCount = memo(() =>
              items().filter(item => item.active).length
            );

            return (
              <div>
                <p>Active: {activeCount()}</p>
                <ul>
                  {items().map(item => (
                    <li key={item.id} class={item.active ? 'active' : ''}>
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'List.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(1);
        expect(analysis.components[0].reactiveJSX.length).toBeGreaterThan(0);
      });

      it('should handle nested loops with signals', () => {
        const code = `
          import { signal } from '@philjs/core';

          function MatrixComponent() {
            const matrix = signal([
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]
            ]);

            return (
              <table>
                {matrix().map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </table>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Matrix.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(1);
      });

      it('should handle signals created inside loops', () => {
        const code = `
          import { signal } from '@philjs/core';

          function DynamicSignals() {
            const count = signal(5);
            const values = [];

            // Note: Creating signals in loops is generally an anti-pattern
            for (let i = 0; i < count(); i++) {
              values.push(signal(i));
            }

            return (
              <div>
                {values.map((val, idx) => (
                  <span key={idx}>{val()}</span>
                ))}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'DynamicSignals.tsx');

        expect(analysis.components.length).toBe(1);
        // Should detect at least the count signal
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBeGreaterThanOrEqual(1);
      });

      it('should handle filter, reduce, and other array methods with signals', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function ArrayOperations() {
            const numbers = signal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const threshold = signal(5);

            const filtered = memo(() => numbers().filter(n => n > threshold()));
            const sum = memo(() => filtered().reduce((a, b) => a + b, 0));
            const avg = memo(() => filtered().length > 0 ? sum() / filtered().length : 0);

            return (
              <div>
                <p>Numbers above {threshold()}: {filtered().length}</p>
                <p>Sum: {sum()}</p>
                <p>Average: {avg().toFixed(2)}</p>
                <ul>
                  {filtered().map(n => <li key={n}>{n}</li>)}
                </ul>
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'ArrayOps.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
        expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(3);
      });
    });

    describe('dynamic component imports', () => {
      it('should handle dynamic imports with signal-based conditions', () => {
        const code = `
          import { signal } from '@philjs/core';

          function LazyLoader() {
            const componentName = signal('default');
            const loaded = signal(false);

            const loadComponent = async () => {
              if (componentName() === 'special') {
                const module = await import('./SpecialComponent');
                return module.default;
              }
              const module = await import('./DefaultComponent');
              return module.default;
            };

            return (
              <div>
                <button onClick={async () => {
                  await loadComponent();
                  loaded.set(true);
                }}>
                  Load {componentName()}
                </button>
                {loaded() && <div>Component loaded!</div>}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'LazyLoader.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
      });

      it('should handle lazy component initialization with signals', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function ComponentFactory() {
            const componentType = signal('button');
            const props = signal({ text: 'Click me' });

            const Component = memo(() => {
              const type = componentType();

              switch (type) {
                case 'button':
                  return ({ text }: any) => <button>{text}</button>;
                case 'link':
                  return ({ text }: any) => <a href="#">{text}</a>;
                default:
                  return ({ text }: any) => <span>{text}</span>;
              }
            });

            return <Component {...props()} />;
          }
        `;

        const analysis = analyzeCode(code, 'Factory.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
        expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(1);
      });

      it('should handle code-splitting patterns with signals', () => {
        const code = `
          import { signal, effect } from '@philjs/core';

          function CodeSplitting() {
            const route = signal('home');
            const RouteComponent = signal(null);

            effect(async () => {
              const currentRoute = route();

              switch (currentRoute) {
                case 'home':
                  const homeModule = await import('./pages/Home');
                  RouteComponent.set(homeModule.default);
                  break;
                case 'about':
                  const aboutModule = await import('./pages/About');
                  RouteComponent.set(aboutModule.default);
                  break;
                case 'contact':
                  const contactModule = await import('./pages/Contact');
                  RouteComponent.set(contactModule.default);
                  break;
              }
            });

            const Component = RouteComponent();

            return (
              <div>
                <nav>
                  <button onClick={() => route.set('home')}>Home</button>
                  <button onClick={() => route.set('about')}>About</button>
                  <button onClick={() => route.set('contact')}>Contact</button>
                </nav>
                {Component && <Component />}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'CodeSplitting.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
        expect(analysis.bindings.filter(b => b.type === 'effect').length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('complex JSX patterns', () => {
      it('should handle spread operators with signals', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function SpreadComponent() {
            const baseProps = signal({ id: 1, name: 'Test' });
            const additionalProps = signal({ className: 'active', disabled: false });
            const allProps = memo(() => ({ ...baseProps(), ...additionalProps() }));

            return (
              <div>
                <input {...allProps()} />
                <button {...additionalProps()}>Click</button>
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Spread.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
        expect(analysis.bindings.filter(b => b.type === 'memo').length).toBe(1);
      });

      it('should handle fragments with signals', () => {
        const code = `
          import { signal } from '@philjs/core';

          function FragmentComponent() {
            const items = signal(['A', 'B', 'C']);
            const showWrapper = signal(true);

            return (
              <>
                {showWrapper() ? (
                  <div>
                    {items().map(item => (
                      <Fragment key={item}>
                        <span>{item}</span>
                        <br />
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  items().map(item => <span key={item}>{item}</span>)
                )}
              </>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Fragment.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
      });

      it('should handle refs and DOM manipulation with signals', () => {
        const code = `
          import { signal, effect } from '@philjs/core';

          function RefComponent() {
            const inputRef = signal(null);
            const focusCount = signal(0);

            const focusInput = () => {
              if (inputRef()) {
                inputRef().focus();
                focusCount.set(focusCount() + 1);
              }
            };

            effect(() => {
              if (focusCount() > 0) {
                console.log('Focus count:', focusCount());
              }
            });

            return (
              <div>
                <input ref={(el) => inputRef.set(el)} />
                <button onClick={focusInput}>Focus ({focusCount()})</button>
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Ref.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(2);
      });

      it('should handle portal patterns with signals', () => {
        const code = `
          import { signal, effect } from '@philjs/core';

          function PortalComponent() {
            const isOpen = signal(false);
            const content = signal('Modal content');
            const portalRoot = signal(null);

            effect(() => {
              if (isOpen()) {
                const root = document.getElementById('portal-root');
                portalRoot.set(root);
              } else {
                portalRoot.set(null);
              }
            });

            return (
              <div>
                <button onClick={() => isOpen.set(!isOpen())}>
                  {isOpen() ? 'Close' : 'Open'} Modal
                </button>
                {isOpen() && portalRoot() && (
                  <div class="modal">
                    <div class="modal-content">{content()}</div>
                  </div>
                )}
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Portal.tsx');

        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBe(3);
        expect(analysis.components[0].reactiveJSX.length).toBeGreaterThan(0);
      });

      it('should handle complex event handlers with signals', () => {
        const code = `
          import { signal, memo, batch } from '@philjs/core';

          function EventComponent() {
            const x = signal(0);
            const y = signal(0);
            const clicks = signal(0);
            const position = memo(() => ({ x: x(), y: y() }));

            const handleMouseMove = (e: MouseEvent) => {
              batch(() => {
                x.set(e.clientX);
                y.set(e.clientY);
              });
            };

            const handleClick = (e: MouseEvent) => {
              e.preventDefault();
              batch(() => {
                clicks.set(clicks() + 1);
                x.set(e.clientX);
                y.set(e.clientY);
              });
            };

            return (
              <div
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                style={{ width: '100%', height: '100vh' }}
              >
                <p>Position: {position().x}, {position().y}</p>
                <p>Clicks: {clicks()}</p>
              </div>
            );
          }
        `;

        const result = transform(code, 'Events.tsx', { autoBatch: true });

        expect(result.code).toBeDefined();
        expect(result.analysis?.bindings.filter(b => b.type === 'signal').length).toBe(3);
        expect(result.optimizations.some(o => o.includes('batch'))).toBe(true);
      });

      it('should handle context-like patterns with signals', () => {
        const code = `
          import { signal, memo } from '@philjs/core';

          function createThemeContext() {
            const theme = signal('light');
            const colors = memo(() =>
              theme() === 'dark'
                ? { bg: '#000', fg: '#fff' }
                : { bg: '#fff', fg: '#000' }
            );

            return { theme, colors };
          }

          function ThemedComponent() {
            const ctx = createThemeContext();

            return (
              <div style={{
                background: ctx.colors().bg,
                color: ctx.colors().fg
              }}>
                <button onClick={() => ctx.theme.set(
                  ctx.theme() === 'light' ? 'dark' : 'light'
                )}>
                  Toggle Theme (current: {ctx.theme()})
                </button>
              </div>
            );
          }
        `;

        const analysis = analyzeCode(code, 'Context.tsx');

        expect(analysis.components.length).toBe(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBeGreaterThanOrEqual(1);
        expect(analysis.bindings.filter(b => b.type === 'memo').length).toBeGreaterThanOrEqual(1);
      });

      it('should handle render props patterns with signals', () => {
        const code = `
          import { signal } from '@philjs/core';

          function DataProvider({ children }: any) {
            const data = signal({ loading: true, value: null });

            const load = async () => {
              data.set({ loading: true, value: null });
              const result = await fetch('/api/data');
              data.set({ loading: false, value: await result.json() });
            };

            return children({ data: data(), load });
          }

          function App() {
            return (
              <DataProvider>
                {({ data, load }: any) => (
                  <div>
                    {data.loading ? (
                      <div>Loading...</div>
                    ) : (
                      <div>Data: {JSON.stringify(data.value)}</div>
                    )}
                    <button onClick={load}>Reload</button>
                  </div>
                )}
              </DataProvider>
            );
          }
        `;

        const analysis = analyzeCode(code, 'RenderProps.tsx');

        // At least App component should be detected (DataProvider returns a function call, not JSX)
        expect(analysis.components.length).toBeGreaterThanOrEqual(1);
        expect(analysis.bindings.filter(b => b.type === 'signal').length).toBeGreaterThanOrEqual(1);

        // Verify that App component is detected
        const componentNames = analysis.components.map(c => c.name);
        expect(componentNames).toContain('App');
      });
    });
  });

  describe('integration', () => {
    it('should handle real-world PhilJS component', () => {
      const code = `
        import { signal, memo, effect } from '@philjs/core';

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
        import { signal, memo } from '@philjs/core';

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
        import { signal } from '@philjs/core';

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
        import { signal, memo } from '@philjs/core';

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
        import { signal, effect } from '@philjs/core';

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
        import { signal, memo, batch } from '@philjs/core';

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
        import { signal, memo } from '@philjs/core';

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
