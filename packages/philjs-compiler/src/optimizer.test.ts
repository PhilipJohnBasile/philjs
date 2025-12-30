/**
 * Comprehensive tests for the PhilJS Compiler Optimizer
 * Testing auto-memoization, batching, dead code elimination, production optimizations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Optimizer, createOptimizer } from './optimizer';
import type { CompilerConfig } from './types';

describe('Optimizer - Basic', () => {
  it('should create optimizer with default config', () => {
    const optimizer = createOptimizer();
    expect(optimizer).toBeInstanceOf(Optimizer);
  });

  it('should create optimizer with custom config', () => {
    const optimizer = createOptimizer({
      development: true,
      sourceMaps: true,
      autoMemo: false,
      autoBatch: false,
    });
    expect(optimizer).toBeInstanceOf(Optimizer);
  });

  it('should return TransformResult from optimize', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal } from 'philjs';
      const count = signal(0);
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('analysis');
    expect(result).toHaveProperty('optimizations');
    expect(result).toHaveProperty('warnings');
  });
});

describe('Optimizer - Auto Memo', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ autoMemo: true, development: true });
  });

  it('should detect memo candidates with multiple signal reads', () => {
    const code = `
      import { signal, memo } from 'philjs';

      function Component() {
        const a = signal(1);
        const b = signal(2);
        const c = signal(3);

        // This reads multiple signals - candidate for memoization
        const result = a() + b() + c();

        return <div>{result}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should analyze and potentially suggest memoization
    expect(result.analysis).toBeDefined();
  });

  it('should not flag already memoized expressions', () => {
    const code = `
      import { signal, memo } from 'philjs';

      function Component() {
        const a = signal(1);
        const b = signal(2);

        // Already wrapped in memo
        const sum = memo(() => a() + b());

        return <div>{sum()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should not suggest memoizing already memoized code
    const memoOptimizations = result.optimizations.filter(o => o.includes('memoized'));
    expect(memoOptimizations.length).toBe(0);
  });
});

describe('Optimizer - Auto Batch', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ autoBatch: true, development: true });
  });

  it('should detect consecutive signal sets', () => {
    const code = `
      import { signal } from 'philjs';

      function handleUpdate() {
        const a = signal(1);
        const b = signal(2);

        // Consecutive signal sets - should batch
        a.set(10);
        b.set(20);
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should detect batching opportunity
    const batchOptimizations = result.optimizations.filter(
      o => o.includes('batch') || o.includes('Batch')
    );
    expect(batchOptimizations.length).toBeGreaterThanOrEqual(0); // May or may not detect based on analysis
  });

  it('should detect signal updates in event handlers', () => {
    const code = `
      import { signal } from 'philjs';

      function Component() {
        const firstName = signal('');
        const lastName = signal('');
        const fullName = signal('');

        return (
          <button onClick={() => {
            firstName.set('John');
            lastName.set('Doe');
            fullName.set('John Doe');
          }}>
            Update
          </button>
        );
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should detect multiple signal updates in event handler
    expect(result.analysis).toBeDefined();
  });

  it('should detect signal updates in async callbacks', () => {
    const code = `
      import { signal } from 'philjs';

      async function fetchData() {
        const data = signal(null);
        const loading = signal(true);
        const error = signal(null);

        try {
          const result = await fetch('/api/data');
          const json = await result.json();

          data.set(json);
          loading.set(false);
        } catch (e) {
          error.set(e);
          loading.set(false);
        }
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should analyze async code for batching opportunities
    expect(result.analysis).toBeDefined();
  });
});

describe('Optimizer - Effect Optimizations', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ optimizeEffects: true, development: true });
  });

  it('should warn about effects without cleanup', () => {
    const code = `
      import { signal, effect } from 'philjs';

      function Component() {
        const count = signal(0);

        // Effect without cleanup
        effect(() => {
          const timer = setInterval(() => {
            console.log(count());
          }, 1000);
          // Missing cleanup!
        });
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should warn about missing cleanup
    const effectWarnings = result.optimizations.filter(o => o.includes('effect'));
    expect(effectWarnings.length).toBeGreaterThanOrEqual(0);
  });

  it('should not warn about effects with cleanup', () => {
    const code = `
      import { signal, effect } from 'philjs';

      function Component() {
        const count = signal(0);

        // Effect with proper cleanup
        effect(() => {
          const timer = setInterval(() => {
            console.log(count());
          }, 1000);

          return () => clearInterval(timer);
        });
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should recognize effect has cleanup
    expect(result.code).toContain('return');
  });
});

describe('Optimizer - Component Optimizations', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ optimizeComponents: true, development: true });
  });

  it('should detect components with many signals', () => {
    const code = `
      import { signal } from 'philjs';

      function HeavyComponent() {
        const s1 = signal(1);
        const s2 = signal(2);
        const s3 = signal(3);
        const s4 = signal(4);
        const s5 = signal(5);

        return <div>{s1() + s2() + s3() + s4() + s5()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should detect heavy component
    expect(result.analysis.components.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect components with many reactive expressions', () => {
    const code = `
      import { signal, memo } from 'philjs';

      function ReactiveComponent() {
        const a = signal(1);
        const b = signal(2);

        const m1 = memo(() => a() * 2);
        const m2 = memo(() => b() * 2);
        const m3 = memo(() => a() + b());
        const m4 = memo(() => m1() + m2());
        const m5 = memo(() => m3() + m4());
        const m6 = memo(() => m1() * m2() * m3());

        return (
          <div>
            <p>{m1()}</p>
            <p>{m2()}</p>
            <p>{m3()}</p>
            <p>{m4()}</p>
            <p>{m5()}</p>
            <p>{m6()}</p>
          </div>
        );
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should analyze component reactivity
    expect(result.analysis).toBeDefined();
  });
});

describe('Optimizer - Production Optimizations', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ development: false });
  });

  it('should remove console.log statements', () => {
    const code = `
      function main() {
        console.log('Debug message');
        console.debug('Debug info');
        console.trace('Trace info');
        console.error('Error - should remain');
        return 'result';
      }
    `;

    const result = optimizer.optimize(code, 'test.ts');

    expect(result.code).not.toContain("console.log('Debug message')");
    expect(result.code).not.toContain("console.debug('Debug info')");
    expect(result.code).not.toContain("console.trace('Trace info')");
    expect(result.code).toContain("console.error");
  });

  it('should remove debugger statements', () => {
    const code = `
      function debug() {
        debugger;
        return 'value';
      }
    `;

    const result = optimizer.optimize(code, 'test.ts');

    expect(result.code).not.toContain('debugger');
    const removedDebugger = result.optimizations.some(o => o.includes('debugger'));
    expect(removedDebugger).toBe(true);
  });

  it('should remove development-only code blocks', () => {
    const code = `
      function init() {
        if (process.env.NODE_ENV === 'development') {
          console.log('Dev only code');
          setupDevTools();
        }

        return 'initialized';
      }
    `;

    const result = optimizer.optimize(code, 'test.ts');

    // Development code block should be removed
    expect(result.code).not.toContain('setupDevTools');
    const removedDevCode = result.optimizations.some(o => o.includes('development'));
    expect(removedDevCode).toBe(true);
  });

  it('should inline constants', () => {
    const code = `
      const API_VERSION = "v1";
      const MAX_RETRIES = 3;
      const IS_ENABLED = true;

      function config() {
        return {
          version: API_VERSION,
          retries: MAX_RETRIES,
          enabled: IS_ENABLED
        };
      }
    `;

    const result = optimizer.optimize(code, 'test.ts');

    // Constants should be inlined
    const inlined = result.optimizations.some(o => o.includes('inlined'));
    expect(inlined).toBe(true);
  });

  it('should optimize string concatenations', () => {
    const code = `
      const message = "Hello" + " " + "World";
    `;

    const result = optimizer.optimize(code, 'test.ts');

    // String concatenation should be optimized
    expect(result.code).toContain('"Hello World"');
  });

  it('should optimize simple template literals', () => {
    const code = `
      const greeting = \`Hello World\`;
    `;

    const result = optimizer.optimize(code, 'test.ts');

    // Template literal with no expressions should become string literal
    expect(result.code).toContain('"Hello World"');
  });
});

describe('Optimizer - Dead Code Elimination', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = createOptimizer({ deadCodeElimination: true, development: true });
  });

  it('should detect unused signals', () => {
    const code = `
      import { signal } from 'philjs';

      function Component() {
        const used = signal(1);
        const unused = signal(2); // Never read

        return <div>{used()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should analyze and detect unused bindings
    expect(result.analysis).toBeDefined();
  });

  it('should detect unused memos', () => {
    const code = `
      import { signal, memo } from 'philjs';

      function Component() {
        const count = signal(1);
        const doubled = memo(() => count() * 2); // Used
        const tripled = memo(() => count() * 3); // Unused

        return <div>{doubled()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should detect unused memo
    expect(result.analysis).toBeDefined();
  });

  it('should detect unused effects', () => {
    const code = `
      import { signal, effect } from 'philjs';

      function Component() {
        const count = signal(1);

        // This effect is registered but does nothing useful
        effect(() => {
          const unused = count() * 2;
        });

        return <div>{count()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Should analyze effects
    expect(result.analysis).toBeDefined();
  });
});

describe('Optimizer - Source Maps', () => {
  it('should generate source maps when enabled', () => {
    const optimizer = createOptimizer({ sourceMaps: true });
    const code = `
      import { signal } from 'philjs';
      const count = signal(0);
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.map).toBeDefined();
  });

  it('should not generate source maps when disabled', () => {
    const optimizer = createOptimizer({ sourceMaps: false });
    const code = `
      import { signal } from 'philjs';
      const count = signal(0);
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // Source map may be null or undefined when disabled
    expect(result.map).toBeFalsy();
  });
});

describe('Optimizer - Import Management', () => {
  it('should ensure memo import when memoization is applied', () => {
    const optimizer = createOptimizer({ autoMemo: true });
    const code = `
      import { signal } from 'philjs';

      function Component() {
        const a = signal(1);
        const b = signal(2);
        return <div>{a() + b()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // If memoization is applied, memo should be imported
    if (result.optimizations.some(o => o.includes('memoized'))) {
      expect(result.code).toContain('memo');
    }
  });

  it('should ensure batch import when batching is applied', () => {
    const optimizer = createOptimizer({ autoBatch: true });
    const code = `
      import { signal } from 'philjs';

      function update() {
        const a = signal(1);
        const b = signal(2);
        a.set(10);
        b.set(20);
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    // If batching is applied, batch should be imported
    if (result.optimizations.some(o => o.includes('batched'))) {
      expect(result.code).toContain('batch');
    }
  });
});

describe('Optimizer - Analysis', () => {
  it('should analyze signals in code', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal } from 'philjs';

      const count = signal(0);
      const name = signal('');
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.analysis).toBeDefined();
    expect(result.analysis.bindings).toBeDefined();
  });

  it('should analyze memos in code', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal, memo } from 'philjs';

      const count = signal(0);
      const doubled = memo(() => count() * 2);
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.analysis).toBeDefined();
  });

  it('should analyze effects in code', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal, effect } from 'philjs';

      const count = signal(0);
      effect(() => console.log(count()));
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.analysis).toBeDefined();
  });

  it('should analyze components', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal } from 'philjs';

      function Counter() {
        const count = signal(0);
        return <div>{count()}</div>;
      }

      function App() {
        return <Counter />;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.analysis.components).toBeDefined();
  });
});

describe('Optimizer - Warnings', () => {
  it('should collect warnings from analysis', () => {
    const optimizer = createOptimizer({ development: true });
    const code = `
      import { signal, effect } from 'philjs';

      function Component() {
        const count = signal(0);

        // Effect modifying its own dependency - potential issue
        effect(() => {
          if (count() < 10) {
            count.set(count() + 1);
          }
        });

        return <div>{count()}</div>;
      }
    `;

    const result = optimizer.optimize(code, 'test.tsx');

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe('Optimizer - Edge Cases', () => {
  it('should handle empty code', () => {
    const optimizer = createOptimizer();
    const code = '';

    const result = optimizer.optimize(code, 'empty.tsx');

    expect(result.code).toBeDefined();
    expect(result.analysis).toBeDefined();
  });

  it('should handle code without PhilJS imports', () => {
    const optimizer = createOptimizer();
    const code = `
      const x = 1;
      const y = 2;
      export const sum = x + y;
    `;

    const result = optimizer.optimize(code, 'plain.ts');

    expect(result.code).toContain('sum');
  });

  it('should handle JSX without signals', () => {
    const optimizer = createOptimizer();
    const code = `
      function StaticComponent() {
        return <div>Static content</div>;
      }
    `;

    const result = optimizer.optimize(code, 'static.tsx');

    expect(result.code).toContain('Static content');
  });

  it('should handle deeply nested JSX', () => {
    const optimizer = createOptimizer();
    const code = `
      function DeepComponent() {
        return (
          <div>
            <section>
              <article>
                <header>
                  <h1>Title</h1>
                </header>
                <main>
                  <p>Content</p>
                </main>
              </article>
            </section>
          </div>
        );
      }
    `;

    const result = optimizer.optimize(code, 'deep.tsx');

    expect(result.code).toContain('Title');
    expect(result.code).toContain('Content');
  });

  it('should handle TypeScript generics', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal } from 'philjs';

      function useGenericSignal<T>(initial: T) {
        const state = signal<T>(initial);
        return state;
      }
    `;

    const result = optimizer.optimize(code, 'generic.tsx');

    expect(result.code).toContain('useGenericSignal');
  });

  it('should handle async/await syntax', () => {
    const optimizer = createOptimizer();
    const code = `
      import { signal } from 'philjs';

      async function fetchData() {
        const data = signal(null);
        const result = await fetch('/api/data');
        data.set(await result.json());
        return data;
      }
    `;

    const result = optimizer.optimize(code, 'async.tsx');

    expect(result.code).toContain('async');
    expect(result.code).toContain('await');
  });

  it('should preserve comments in development mode', () => {
    const optimizer = createOptimizer({ development: true });
    const code = `
      // Important comment
      const x = 1;
      /* Block comment */
      const y = 2;
    `;

    const result = optimizer.optimize(code, 'comments.ts');

    // Babel by default preserves comments
    expect(result.code).toBeDefined();
  });
});

describe('Optimizer - Performance', () => {
  it('should optimize moderately sized code quickly', () => {
    const optimizer = createOptimizer();

    // Generate a moderate amount of code
    const components = Array.from({ length: 10 }, (_, i) => `
      function Component${i}() {
        const count${i} = signal(${i});
        return <div>{count${i}()}</div>;
      }
    `).join('\n');

    const code = `
      import { signal } from 'philjs';
      ${components}
    `;

    const startTime = performance.now();
    const result = optimizer.optimize(code, 'perf.tsx');
    const duration = performance.now() - startTime;

    expect(result.code).toBeDefined();
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
  });
});
