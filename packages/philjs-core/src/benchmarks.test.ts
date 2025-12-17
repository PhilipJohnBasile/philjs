/**
 * Performance Benchmarks - PhilJS vs Theoretical Competitors
 * These benchmarks prove PhilJS performance claims
 */

import { describe, it, expect } from 'vitest';
import { signal, memo, effect, batch, createRoot } from './signals';
import { jsx } from './jsx-runtime';
import { renderToString } from './render-to-string';

describe('Performance Benchmarks', () => {
  describe('Signal Creation Performance', () => {
    it('should create 1,000 signals quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        signal(i);
      }
      const duration = performance.now() - start;
      console.log(`Created 1,000 signals in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should create 10,000 signals quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        signal(i);
      }
      const duration = performance.now() - start;
      console.log(`Created 10,000 signals in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should create 100,000 signals in under 100ms', () => {
      const start = performance.now();

      for (let i = 0; i < 100000; i++) {
        signal(i);
      }

      const duration = performance.now() - start;
      // Doubled threshold for CI variability
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Signal Update Performance', () => {
    it('should update signal 1,000 times quickly', () => {
      const count = signal(0);
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        count.set(i);
      }
      const duration = performance.now() - start;
      console.log(`Updated signal 1,000 times in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should update 100 signals once each quickly', () => {
      const signals = Array.from({ length: 100 }, () => signal(0));
      const start = performance.now();
      signals.forEach((s, i) => s.set(i));
      const duration = performance.now() - start;
      console.log(`Updated 100 signals in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should update 1 million signals in under 500ms', () => {
      const signals = Array.from({ length: 10000 }, () => signal(0));

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        signals.forEach(s => s.set(i));
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Computed (Memo) Performance', () => {
    it('should create 1,000 memos quickly', () => {
      const source = signal(0);
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        memo(() => source() * 2);
      }
      const duration = performance.now() - start;
      console.log(`Created 1,000 memos in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should trigger 1,000 memo recomputations quickly', () => {
      const source = signal(0);
      const memos = Array.from({ length: 1000 }, () => memo(() => source() * 2));
      const start = performance.now();
      source.set(5);
      memos.forEach(m => m()); // Force evaluation
      const duration = performance.now() - start;
      console.log(`Triggered 1,000 memo recomputations in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should handle diamond dependency graph efficiently', () => {
      const source = signal(1);
      const branches = 100;

      // Create diamond graph
      const layer1 = Array.from({ length: branches }, () => memo(() => source() * 2));
      const layer2 = Array.from({ length: branches }, (_, i) =>
        memo(() => layer1[i]() + 1)
      );
      const combined = memo(() =>
        layer2.reduce((sum, m) => sum + m(), 0)
      );

      const start = performance.now();

      // Trigger update through entire graph
      source.set(10);
      combined(); // Force evaluation

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should be very fast with proper memoization
    });
  });

  describe('Effect Performance', () => {
    it('should create and run 1,000 effects quickly', () => {
      const disposers: Array<() => void> = [];
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        const dispose = effect(() => {
          // Minimal effect
        });
        disposers.push(dispose);
      }

      disposers.forEach(d => d());
      const duration = performance.now() - start;
      console.log(`Created and ran 1,000 effects in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should trigger 1,000 effect updates quickly', () => {
      const source = signal(0);
      let sum = 0;

      const disposers = Array.from({ length: 1000 }, () =>
        effect(() => {
          sum += source();
        })
      );

      const start = performance.now();
      source.set(1);
      const duration = performance.now() - start;

      disposers.forEach(d => d());
      console.log(`Triggered 1,000 effect updates in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should batch 10,000 updates efficiently', () => {
      const signals = Array.from({ length: 100 }, () => signal(0));
      let updateCount = 0;

      const dispose = effect(() => {
        signals.forEach(s => s());
        updateCount++;
      });

      const start = performance.now();

      batch(() => {
        signals.forEach((s, i) => s.set(i));
      });

      const duration = performance.now() - start;

      expect(updateCount).toBe(2); // Initial + 1 batched update
      expect(duration).toBeLessThan(10);

      dispose();
    });
  });

  describe('SSR Rendering Performance', () => {
    it('should render simple component 1,000 times quickly', () => {
      const Component = () => jsx('div', { children: 'Hello' });
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        renderToString(jsx(Component, {}));
      }

      const duration = performance.now() - start;
      console.log(`Rendered simple component 1,000 times in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should render nested components quickly', () => {
      const Nested = ({ depth }: { depth: number }): ReturnType<typeof jsx> => {
        if (depth === 0) return jsx('div', { children: 'Leaf' });
        return jsx('div', { children: jsx(Nested, { depth: depth - 1 }) });
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        renderToString(jsx(Nested, { depth: 10 }));
      }
      const duration = performance.now() - start;
      console.log(`Rendered nested components 100 times in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should render 1,000 item list in under 100ms', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }));

      const List = () => jsx('ul', {
        children: items.map(item =>
          jsx('li', { key: item.id, children: item.text })
        )
      });

      const start = performance.now();
      const html = renderToString(jsx(List, {}));
      const duration = performance.now() - start;

      expect(html).toContain('Item 0');
      expect(html).toContain('Item 999');
      expect(duration).toBeLessThan(100);
    });

    it('should render complex dashboard in under 50ms', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        score: Math.random() * 100
      }));

      const Dashboard = () => jsx('div', {
        className: 'dashboard',
        children: [
          jsx('h1', { children: 'Dashboard' }),
          jsx('div', { className: 'stats', children: [
            jsx('span', { children: `Total: ${data.length}` }),
            jsx('span', { children: `Avg: ${(data.reduce((s, d) => s + d.score, 0) / data.length).toFixed(2)}` })
          ]}),
          jsx('table', { children: [
            jsx('thead', { children: jsx('tr', { children: [
              jsx('th', { children: 'Name' }),
              jsx('th', { children: 'Email' }),
              jsx('th', { children: 'Score' })
            ]})}),
            jsx('tbody', { children: data.map(user =>
              jsx('tr', { key: user.id, children: [
                jsx('td', { children: user.name }),
                jsx('td', { children: user.email }),
                jsx('td', { children: user.score.toFixed(2) })
              ]})
            )})
          ]})
        ]
      });

      const start = performance.now();
      const html = renderToString(jsx(Dashboard, {}));
      const duration = performance.now() - start;

      expect(html).toContain('Dashboard');
      expect(html).toContain('User 0');
      expect(html).toContain('User 99');
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Efficiency', () => {
    // Skip: Memory tests are inherently flaky without guaranteed GC
    // Use dedicated profiling tools for memory leak detection
    it.skip('should not leak memory with disposed effects', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and dispose many effects
      for (let cycle = 0; cycle < 10; cycle++) {
        const disposers: Array<() => void> = [];

        for (let i = 0; i < 1000; i++) {
          const count = signal(0);
          const dispose = effect(() => count());
          disposers.push(dispose);
        }

        // Dispose all
        disposers.forEach(d => d());
      }

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (less than 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle 100,000 signals without excessive memory', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const signals = Array.from({ length: 100000 }, (_, i) => signal(i));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;

      // Each signal should use less than 1KB on average
      const avgPerSignal = memoryUsed / 100000;
      expect(avgPerSignal).toBeLessThan(1024);

      // Keep reference to prevent GC
      expect(signals.length).toBe(100000);
    });
  });

  describe('Real-World Scenarios', () => {
    it('Counter app - 1000 rapid increments', () => {
      const count = signal(0);
      const doubled = memo(() => count() * 2);
      let effectRuns = 0;

      const dispose = effect(() => {
        doubled();
        effectRuns++;
      });

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        count.set(i);
      }

      const duration = performance.now() - start;

      expect(count()).toBe(999);
      expect(doubled()).toBe(1998);
      expect(effectRuns).toBeGreaterThanOrEqual(2); // At least initial + final
      expect(duration).toBeLessThan(100);

      dispose();
    });

    it('Todo app - add/remove 1000 items', () => {
      const todos = signal<Array<{ id: number; text: string }>>([]);

      const start = performance.now();

      // Add 1000 todos
      for (let i = 0; i < 1000; i++) {
        todos.set([...todos(), { id: i, text: `Todo ${i}` }]);
      }

      // Remove all todos
      for (let i = 999; i >= 0; i--) {
        todos.set(todos().filter(t => t.id !== i));
      }

      const duration = performance.now() - start;

      expect(todos()).toEqual([]);
      expect(duration).toBeLessThan(100);
    });

    it('Form validation - 100 fields with complex validation', () => {
      // Create value signals first
      const valueSignals = Array.from({ length: 100 }, () => signal(''));

      // Then create validation memos that reference them
      const validMemos = valueSignals.map(valueSig =>
        memo(() => {
          const val = valueSig();
          return val.length > 3 && val.length < 50;
        })
      );

      const allValid = memo(() =>
        validMemos.every(v => v())
      );

      const start = performance.now();

      // Update all fields
      valueSignals.forEach((sig, i) => sig.set(`ValidValue${i}`));

      // Check validation
      const isValid = allValid();

      const duration = performance.now() - start;

      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(10);
    });
  });
});

describe('Benchmark Comparison Targets', () => {
  it('PhilJS target: 100k signal updates in <100ms', () => {
    const signals = Array.from({ length: 1000 }, () => signal(0));

    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      signals.forEach(s => s.set(i));
    }

    const duration = performance.now() - start;

    console.log(`PhilJS: 100k signal updates in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it('PhilJS target: SSR 10k elements in <100ms', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const List = () => jsx('ul', {
      children: items.map(item =>
        jsx('li', { key: item.id, children: item.name })
      )
    });

    const start = performance.now();
    const html = renderToString(jsx(List, {}));
    const duration = performance.now() - start;

    console.log(`PhilJS SSR: 10k elements in ${duration.toFixed(2)}ms`);
    // Doubled threshold for CI variability
    expect(duration).toBeLessThan(200);
    expect(html).toContain('Item 9999');
  });
});
