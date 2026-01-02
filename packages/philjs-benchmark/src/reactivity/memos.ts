/**
 * Memo/computed value benchmarks.
 * Tests derived value computation and caching performance.
 */

import { signal, memo, effect, batch } from '@philjs/core';
import { gc } from '../utils.js';
import type { Benchmark } from '../types.js';

/**
 * Create 100k memos.
 */
export const create100kMemos: Benchmark = {
  name: 'create-100k-memos',
  iterations: 10,
  fn: async () => {
    const sig = signal(0);
    const memos: ReturnType<typeof memo<number>>[] = [];

    for (let i = 0; i < 100_000; i++) {
      memos.push(memo(() => sig() * 2 + i));
    }
  },
};

/**
 * Create 10k memos.
 */
export const create10kMemos: Benchmark = {
  name: 'create-10k-memos',
  iterations: 50,
  fn: async () => {
    const sig = signal(0);
    const memos: ReturnType<typeof memo<number>>[] = [];

    for (let i = 0; i < 10_000; i++) {
      memos.push(memo(() => sig() * 2 + i));
    }
  },
};

/**
 * Memo caching performance (read cached value).
 */
export const memoCaching: Benchmark = {
  name: 'memo-caching-1m-reads',
  iterations: 50,
  fn: async () => {
    const sig = signal(42);
    const derived = memo(() => sig() * 2);

    // First read to compute
    derived();

    // Subsequent reads should be cached
    let sum = 0;
    for (let i = 0; i < 1_000_000; i++) {
      sum += derived();
    }
  },
};

/**
 * Memo recomputation performance.
 */
export const memoRecomputation: Benchmark = {
  name: 'memo-recomputation-10k',
  iterations: 50,
  fn: async () => {
    const sig = signal(0);
    const derived = memo(() => sig() * 2);

    for (let i = 0; i < 10_000; i++) {
      sig.set(i);
      derived(); // Force recomputation
    }
  },
};

/**
 * Chain of memos.
 */
export const memoChain: Benchmark = {
  name: 'memo-chain-100',
  iterations: 50,
  fn: async () => {
    const source = signal(0);
    let current: ReturnType<typeof memo<number>> | ReturnType<typeof signal<number>> = source;

    // Create chain of 100 memos
    for (let i = 0; i < 100; i++) {
      const prev = current;
      current = memo(() => prev() + 1);
    }

    // Read final value
    current();

    // Update source and propagate
    for (let i = 0; i < 100; i++) {
      source.set(i);
      current();
    }
  },
};

/**
 * Wide memo tree.
 */
export const wideMemoTree: Benchmark = {
  name: 'wide-memo-tree-1000',
  iterations: 20,
  fn: async () => {
    const source = signal(0);
    const memos: ReturnType<typeof memo<number>>[] = [];

    // 1000 memos all depending on source
    for (let i = 0; i < 1000; i++) {
      memos.push(memo(() => source() * 2 + i));
    }

    // Read all
    for (const m of memos) {
      m();
    }

    // Update source
    for (let i = 0; i < 10; i++) {
      source.set(i);
      // Read all again
      for (const m of memos) {
        m();
      }
    }
  },
};

/**
 * Memo with expensive computation.
 */
export const memoExpensiveComputation: Benchmark = {
  name: 'memo-expensive-computation',
  iterations: 50,
  fn: async () => {
    const data = signal<number[]>(Array.from({ length: 1000 }, (_, i) => i));

    const sum = memo(() => {
      return data().reduce((a, b) => a + b, 0);
    });

    const average = memo(() => {
      const total = sum();
      return total / data().length;
    });

    // Read computed values
    average();

    // Update data
    for (let i = 0; i < 100; i++) {
      data.set(data().map(x => x + 1));
      average();
    }
  },
};

/**
 * Memo with filter/map operations.
 */
export const memoFilterMap: Benchmark = {
  name: 'memo-filter-map-1k-items',
  iterations: 50,
  fn: async () => {
    const items = signal<{ id: number; value: number; active: boolean }[]>(
      Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: i * 10,
        active: i % 2 === 0,
      }))
    );

    const activeItems = memo(() => items().filter(item => item.active));
    const values = memo(() => activeItems().map(item => item.value));
    const total = memo(() => values().reduce((a, b) => a + b, 0));

    // Read
    total();

    // Update items
    for (let i = 0; i < 50; i++) {
      items.set(items().map((item, idx) => ({
        ...item,
        active: (idx + i) % 2 === 0,
      })));
      total();
    }
  },
};

/**
 * Memo equality check with objects.
 */
export const memoObjectEquality: Benchmark = {
  name: 'memo-object-equality-1k',
  iterations: 50,
  fn: async () => {
    const sig = signal({ count: 0 });

    const derived = memo(() => ({
      doubled: sig().count * 2,
      tripled: sig().count * 3,
    }));

    for (let i = 0; i < 1_000; i++) {
      sig.set({ count: i });
      derived();
    }
  },
};

/**
 * Cascading memos.
 */
export const cascadingMemos: Benchmark = {
  name: 'cascading-memos-10-levels',
  iterations: 50,
  fn: async () => {
    const source = signal(0);

    // Create 10 levels of cascading memos
    const level1 = memo(() => source() + 1);
    const level2 = memo(() => level1() + 1);
    const level3 = memo(() => level2() + 1);
    const level4 = memo(() => level3() + 1);
    const level5 = memo(() => level4() + 1);
    const level6 = memo(() => level5() + 1);
    const level7 = memo(() => level6() + 1);
    const level8 = memo(() => level7() + 1);
    const level9 = memo(() => level8() + 1);
    const level10 = memo(() => level9() + 1);

    // Read
    level10();

    // Update
    for (let i = 0; i < 1_000; i++) {
      source.set(i);
      level10();
    }
  },
};

/**
 * Memo with conditional logic.
 */
export const memoConditional: Benchmark = {
  name: 'memo-conditional-1k',
  iterations: 50,
  fn: async () => {
    const condition = signal(true);
    const valueA = signal(10);
    const valueB = signal(20);

    const result = memo(() => {
      if (condition()) {
        return valueA() * 2;
      } else {
        return valueB() * 3;
      }
    });

    for (let i = 0; i < 1_000; i++) {
      if (i % 10 === 0) {
        condition.set(!condition());
      }
      if (condition()) {
        valueA.set(i);
      } else {
        valueB.set(i);
      }
      result();
    }
  },
};

/**
 * Multiple memos with shared dependency.
 */
export const memosSharedDependency: Benchmark = {
  name: 'memos-shared-dependency-100',
  iterations: 50,
  fn: async () => {
    const shared = signal(0);
    const memos: ReturnType<typeof memo<number>>[] = [];

    // 100 memos sharing the same dependency
    for (let i = 0; i < 100; i++) {
      memos.push(memo(() => shared() * i));
    }

    // Read all
    for (const m of memos) {
      m();
    }

    // Update shared
    for (let i = 0; i < 100; i++) {
      shared.set(i);
      // Read all
      for (const m of memos) {
        m();
      }
    }
  },
};

export const memoBenchmarks: Benchmark[] = [
  create100kMemos,
  create10kMemos,
  memoCaching,
  memoRecomputation,
  memoChain,
  wideMemoTree,
  memoExpensiveComputation,
  memoFilterMap,
  memoObjectEquality,
  cascadingMemos,
  memoConditional,
  memosSharedDependency,
];

export default memoBenchmarks;
