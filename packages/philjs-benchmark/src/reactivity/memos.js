/**
 * Memo/computed value benchmarks.
 * Tests derived value computation and caching performance.
 */
import { signal, memo, effect, batch } from '@philjs/core';
import { gc } from '../utils.js';
/**
 * Create 100k memos.
 */
export const create100kMemos = {
    name: 'create-100k-memos',
    iterations: 10,
    fn: async () => {
        const sig = signal(0);
        const memos = [];
        for (let i = 0; i < 100_000; i++) {
            memos.push(memo(() => sig() * 2 + i));
        }
    },
};
/**
 * Create 10k memos.
 */
export const create10kMemos = {
    name: 'create-10k-memos',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        const memos = [];
        for (let i = 0; i < 10_000; i++) {
            memos.push(memo(() => sig() * 2 + i));
        }
    },
};
/**
 * Memo caching performance (read cached value).
 */
export const memoCaching = {
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
export const memoRecomputation = {
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
export const memoChain = {
    name: 'memo-chain-100',
    iterations: 50,
    fn: async () => {
        const source = signal(0);
        let current = source;
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
export const wideMemoTree = {
    name: 'wide-memo-tree-1000',
    iterations: 20,
    fn: async () => {
        const source = signal(0);
        const memos = [];
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
export const memoExpensiveComputation = {
    name: 'memo-expensive-computation',
    iterations: 50,
    fn: async () => {
        const data = signal(Array.from({ length: 1000 }, (_, i) => i));
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
export const memoFilterMap = {
    name: 'memo-filter-map-1k-items',
    iterations: 50,
    fn: async () => {
        const items = signal(Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            value: i * 10,
            active: i % 2 === 0,
        })));
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
export const memoObjectEquality = {
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
export const cascadingMemos = {
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
export const memoConditional = {
    name: 'memo-conditional-1k',
    iterations: 50,
    fn: async () => {
        const condition = signal(true);
        const valueA = signal(10);
        const valueB = signal(20);
        const result = memo(() => {
            if (condition()) {
                return valueA() * 2;
            }
            else {
                return valueB() * 3;
            }
        });
        for (let i = 0; i < 1_000; i++) {
            if (i % 10 === 0) {
                condition.set(!condition());
            }
            if (condition()) {
                valueA.set(i);
            }
            else {
                valueB.set(i);
            }
            result();
        }
    },
};
/**
 * Multiple memos with shared dependency.
 */
export const memosSharedDependency = {
    name: 'memos-shared-dependency-100',
    iterations: 50,
    fn: async () => {
        const shared = signal(0);
        const memos = [];
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
export const memoBenchmarks = [
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
//# sourceMappingURL=memos.js.map