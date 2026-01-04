/**
 * Signal creation and update benchmarks.
 * Tests the core reactivity primitives performance.
 */
import { signal, memo, batch, untrack } from '@philjs/core';
import { now, calculateStats, gc } from '../utils.js';
/**
 * Create 1 million signals.
 */
export const createMillionSignals = {
    name: 'create-1m-signals',
    iterations: 10,
    fn: async () => {
        const signals = [];
        for (let i = 0; i < 1_000_000; i++) {
            signals.push(signal(i));
        }
    },
};
/**
 * Create 100k signals.
 */
export const create100kSignals = {
    name: 'create-100k-signals',
    iterations: 20,
    fn: async () => {
        const signals = [];
        for (let i = 0; i < 100_000; i++) {
            signals.push(signal(i));
        }
    },
};
/**
 * Create 10k signals.
 */
export const create10kSignals = {
    name: 'create-10k-signals',
    iterations: 100,
    fn: async () => {
        const signals = [];
        for (let i = 0; i < 10_000; i++) {
            signals.push(signal(i));
        }
    },
};
/**
 * Signal read performance (1M reads).
 */
export const readMillionSignals = {
    name: 'read-1m-signals',
    iterations: 50,
    setup: async () => {
        gc();
    },
    fn: async () => {
        const sig = signal(42);
        let sum = 0;
        for (let i = 0; i < 1_000_000; i++) {
            sum += sig();
        }
    },
};
/**
 * Signal write performance (100k writes).
 */
export const write100kSignals = {
    name: 'write-100k-signals',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        for (let i = 0; i < 100_000; i++) {
            sig.set(i);
        }
    },
};
/**
 * Signal write with updater function (100k writes).
 */
export const writeUpdater100k = {
    name: 'write-updater-100k',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        for (let i = 0; i < 100_000; i++) {
            sig.set(prev => prev + 1);
        }
    },
};
/**
 * Wide signal graph (1000 signals, each with 10 dependents).
 */
export const wideSignalGraph = {
    name: 'wide-signal-graph-1000x10',
    iterations: 20,
    fn: async () => {
        const sources = [];
        const derived = [];
        // Create 1000 source signals
        for (let i = 0; i < 1000; i++) {
            sources.push(signal(i));
        }
        // Create 10 derived values per source
        for (const src of sources) {
            for (let j = 0; j < 10; j++) {
                derived.push(memo(() => src() * 2 + j));
            }
        }
        // Update all sources
        for (let i = 0; i < sources.length; i++) {
            sources[i].set(i + 1);
        }
    },
};
/**
 * Deep signal graph (chain of 1000 memos).
 */
export const deepSignalGraph = {
    name: 'deep-signal-graph-1000',
    iterations: 50,
    fn: async () => {
        const source = signal(0);
        let current = source;
        // Create chain of 1000 derived values
        for (let i = 0; i < 1000; i++) {
            const prev = current;
            current = memo(() => prev() + 1);
        }
        // Read the final value to trigger computation
        current();
        // Update source
        source.set(1);
        // Read again to trigger propagation
        current();
    },
};
/**
 * Diamond dependency pattern.
 */
export const diamondDependency = {
    name: 'diamond-dependency',
    iterations: 100,
    fn: async () => {
        const source = signal(0);
        // Two branches from source
        const left = memo(() => source() * 2);
        const right = memo(() => source() * 3);
        // Converge
        const result = memo(() => left() + right());
        // Read
        result();
        // Update source 100 times
        for (let i = 0; i < 100; i++) {
            source.set(i);
            result();
        }
    },
};
/**
 * Multiple diamond dependencies.
 */
export const multipleDiamonds = {
    name: 'multiple-diamonds-100',
    iterations: 50,
    fn: async () => {
        const sources = [];
        const results = [];
        // Create 100 diamond patterns
        for (let i = 0; i < 100; i++) {
            const source = signal(i);
            sources.push(source);
            const left = memo(() => source() * 2);
            const right = memo(() => source() * 3);
            const result = memo(() => left() + right());
            results.push(result);
        }
        // Read all results
        for (const result of results) {
            result();
        }
        // Update all sources
        for (let i = 0; i < sources.length; i++) {
            sources[i].set(i + 1);
        }
        // Read all results again
        for (const result of results) {
            result();
        }
    },
};
/**
 * Untrack performance.
 */
export const untrackPerformance = {
    name: 'untrack-100k-reads',
    iterations: 50,
    fn: async () => {
        const sig = signal(42);
        let sum = 0;
        for (let i = 0; i < 100_000; i++) {
            sum += untrack(() => sig());
        }
    },
};
/**
 * Signal peek performance.
 */
export const peekPerformance = {
    name: 'peek-100k-reads',
    iterations: 50,
    fn: async () => {
        const sig = signal(42);
        let sum = 0;
        for (let i = 0; i < 100_000; i++) {
            sum += sig.peek();
        }
    },
};
/**
 * Object signal updates.
 */
export const objectSignalUpdates = {
    name: 'object-signal-updates-10k',
    iterations: 50,
    fn: async () => {
        const sig = signal({ count: 0, data: 'test' });
        for (let i = 0; i < 10_000; i++) {
            sig.set({ ...sig(), count: i });
        }
    },
};
/**
 * Array signal updates.
 */
export const arraySignalUpdates = {
    name: 'array-signal-updates-10k',
    iterations: 50,
    fn: async () => {
        const sig = signal([]);
        for (let i = 0; i < 10_000; i++) {
            sig.set([...sig(), i]);
        }
    },
};
export const signalBenchmarks = [
    createMillionSignals,
    create100kSignals,
    create10kSignals,
    readMillionSignals,
    write100kSignals,
    writeUpdater100k,
    wideSignalGraph,
    deepSignalGraph,
    diamondDependency,
    multipleDiamonds,
    untrackPerformance,
    peekPerformance,
    objectSignalUpdates,
    arraySignalUpdates,
];
export default signalBenchmarks;
//# sourceMappingURL=signals.js.map