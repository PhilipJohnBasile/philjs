/**
 * Batch update benchmarks.
 * Tests batching performance and its impact on reactivity.
 */
import { signal, effect, batch, memo } from 'philjs-core';
/**
 * Batch 100 updates.
 */
export const batch100Updates = {
    name: 'batch-100-updates',
    iterations: 100,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 100; i++) {
                sig.set(i);
            }
        });
        dispose();
    },
};
/**
 * Batch 1000 updates.
 */
export const batch1000Updates = {
    name: 'batch-1000-updates',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 1000; i++) {
                sig.set(i);
            }
        });
        dispose();
    },
};
/**
 * Batch 10000 updates.
 */
export const batch10000Updates = {
    name: 'batch-10000-updates',
    iterations: 20,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 10000; i++) {
                sig.set(i);
            }
        });
        dispose();
    },
};
/**
 * Batch vs unbatched comparison - unbatched baseline.
 */
export const unbatched1000Updates = {
    name: 'unbatched-1000-updates',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        for (let i = 0; i < 1000; i++) {
            sig.set(i);
        }
        dispose();
    },
};
/**
 * Batch multiple signals.
 */
export const batchMultipleSignals = {
    name: 'batch-multiple-signals-10x100',
    iterations: 50,
    fn: async () => {
        const signals = Array.from({ length: 10 }, (_, i) => signal(i));
        let effectCount = 0;
        const dispose = effect(() => {
            let sum = 0;
            for (const sig of signals) {
                sum += sig();
            }
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 100; i++) {
                for (const sig of signals) {
                    sig.set(prev => prev + 1);
                }
            }
        });
        dispose();
    },
};
/**
 * Nested batches.
 */
export const nestedBatches = {
    name: 'nested-batches-10-levels',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        const nestBatch = (depth) => {
            if (depth === 0) {
                for (let i = 0; i < 10; i++) {
                    sig.set(prev => prev + 1);
                }
            }
            else {
                batch(() => {
                    nestBatch(depth - 1);
                });
            }
        };
        batch(() => {
            nestBatch(10);
        });
        dispose();
    },
};
/**
 * Batch with derived values.
 */
export const batchWithDerived = {
    name: 'batch-with-derived-values',
    iterations: 50,
    fn: async () => {
        const sig1 = signal(0);
        const sig2 = signal(0);
        const derived1 = memo(() => sig1() * 2);
        const derived2 = memo(() => sig2() * 3);
        const combined = memo(() => derived1() + derived2());
        let effectCount = 0;
        const dispose = effect(() => {
            combined();
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 100; i++) {
                sig1.set(i);
                sig2.set(i);
            }
        });
        dispose();
    },
};
/**
 * Batch with diamond dependency.
 */
export const batchDiamondDependency = {
    name: 'batch-diamond-dependency',
    iterations: 50,
    fn: async () => {
        const source = signal(0);
        const left = memo(() => source() * 2);
        const right = memo(() => source() * 3);
        const combined = memo(() => left() + right());
        let effectCount = 0;
        const dispose = effect(() => {
            combined();
            effectCount++;
        });
        batch(() => {
            for (let i = 0; i < 100; i++) {
                source.set(i);
            }
        });
        dispose();
    },
};
/**
 * Batch with multiple effects.
 */
export const batchMultipleEffects = {
    name: 'batch-multiple-effects-100',
    iterations: 20,
    fn: async () => {
        const sig = signal(0);
        const disposes = [];
        let totalEffectCount = 0;
        // Create 100 effects
        for (let i = 0; i < 100; i++) {
            const dispose = effect(() => {
                sig();
                totalEffectCount++;
            });
            disposes.push(dispose);
        }
        // Batch update
        batch(() => {
            for (let i = 0; i < 100; i++) {
                sig.set(i);
            }
        });
        // Cleanup
        for (const dispose of disposes) {
            dispose();
        }
    },
};
/**
 * Batch return value.
 */
export const batchReturnValue = {
    name: 'batch-return-value-1k',
    iterations: 100,
    fn: async () => {
        const sig = signal(0);
        for (let i = 0; i < 1000; i++) {
            const result = batch(() => {
                sig.set(i);
                return sig() * 2;
            });
        }
    },
};
/**
 * Interleaved batch and non-batch.
 */
export const interleavedBatch = {
    name: 'interleaved-batch-nonbatch',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        let effectCount = 0;
        const dispose = effect(() => {
            sig();
            effectCount++;
        });
        for (let i = 0; i < 100; i++) {
            if (i % 2 === 0) {
                batch(() => {
                    sig.set(i);
                    sig.set(i + 1);
                });
            }
            else {
                sig.set(i);
            }
        }
        dispose();
    },
};
/**
 * Batch array operations.
 */
export const batchArrayOperations = {
    name: 'batch-array-operations',
    iterations: 50,
    fn: async () => {
        const items = signal([]);
        let effectCount = 0;
        const dispose = effect(() => {
            items();
            effectCount++;
        });
        batch(() => {
            // Add 100 items
            for (let i = 0; i < 100; i++) {
                items.set([...items(), i]);
            }
        });
        dispose();
    },
};
export const batchBenchmarks = [
    batch100Updates,
    batch1000Updates,
    batch10000Updates,
    unbatched1000Updates,
    batchMultipleSignals,
    nestedBatches,
    batchWithDerived,
    batchDiamondDependency,
    batchMultipleEffects,
    batchReturnValue,
    interleavedBatch,
    batchArrayOperations,
];
export default batchBenchmarks;
//# sourceMappingURL=batch.js.map