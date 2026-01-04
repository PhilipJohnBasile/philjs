/**
 * Effect execution benchmarks.
 * Tests effect creation, execution, and cleanup performance.
 */
import { signal, effect, batch, onCleanup, createRoot } from '@philjs/core';
import { gc } from '../utils.js';
/**
 * Create 10k effects.
 */
export const create10kEffects = {
    name: 'create-10k-effects',
    iterations: 20,
    fn: async () => {
        const disposes = [];
        const sig = signal(0);
        for (let i = 0; i < 10_000; i++) {
            const dispose = effect(() => {
                sig();
            });
            disposes.push(dispose);
        }
        // Cleanup
        for (const dispose of disposes) {
            dispose();
        }
    },
};
/**
 * Create 1k effects.
 */
export const create1kEffects = {
    name: 'create-1k-effects',
    iterations: 100,
    fn: async () => {
        const disposes = [];
        const sig = signal(0);
        for (let i = 0; i < 1_000; i++) {
            const dispose = effect(() => {
                sig();
            });
            disposes.push(dispose);
        }
        // Cleanup
        for (const dispose of disposes) {
            dispose();
        }
    },
};
/**
 * Effect with single dependency update.
 */
export const effectSingleDependency = {
    name: 'effect-single-dependency-10k-updates',
    iterations: 50,
    fn: async () => {
        const sig = signal(0);
        let callCount = 0;
        const dispose = effect(() => {
            sig();
            callCount++;
        });
        for (let i = 0; i < 10_000; i++) {
            sig.set(i);
        }
        dispose();
    },
};
/**
 * Effect with multiple dependencies.
 */
export const effectMultipleDependencies = {
    name: 'effect-multi-dependency-1k-updates',
    iterations: 50,
    fn: async () => {
        const sig1 = signal(0);
        const sig2 = signal(0);
        const sig3 = signal(0);
        const sig4 = signal(0);
        const sig5 = signal(0);
        let callCount = 0;
        const dispose = effect(() => {
            sig1();
            sig2();
            sig3();
            sig4();
            sig5();
            callCount++;
        });
        for (let i = 0; i < 1_000; i++) {
            sig1.set(i);
            sig2.set(i);
            sig3.set(i);
            sig4.set(i);
            sig5.set(i);
        }
        dispose();
    },
};
/**
 * Effect cleanup performance.
 */
export const effectCleanup = {
    name: 'effect-cleanup-10k-cycles',
    iterations: 20,
    fn: async () => {
        const sig = signal(0);
        const dispose = effect(() => {
            const value = sig();
            onCleanup(() => {
                // Simulate cleanup work
                const temp = value * 2;
            });
        });
        for (let i = 0; i < 10_000; i++) {
            sig.set(i);
        }
        dispose();
    },
};
/**
 * Effect disposal performance.
 */
export const effectDisposal = {
    name: 'effect-disposal-10k',
    iterations: 20,
    fn: async () => {
        const sig = signal(0);
        for (let i = 0; i < 10_000; i++) {
            const dispose = effect(() => {
                sig();
            });
            dispose();
        }
    },
};
/**
 * Nested effects.
 */
export const nestedEffects = {
    name: 'nested-effects-100-depth',
    iterations: 50,
    fn: async () => {
        const disposes = [];
        const sig = signal(0);
        let innerDispose;
        const outerDispose = effect(() => {
            if (innerDispose)
                innerDispose();
            const value = sig();
            // Create nested effect
            innerDispose = effect(() => {
                const derived = value * 2;
            });
        });
        disposes.push(outerDispose);
        if (innerDispose)
            disposes.push(innerDispose);
        // Update signal to trigger nested effect recreation
        for (let i = 0; i < 100; i++) {
            sig.set(i);
        }
        // Cleanup
        for (const dispose of disposes) {
            dispose();
        }
    },
};
/**
 * Effect with conditional dependencies.
 */
export const conditionalDependencies = {
    name: 'conditional-dependencies-1k',
    iterations: 50,
    fn: async () => {
        const condition = signal(true);
        const sigA = signal(0);
        const sigB = signal(0);
        let callCount = 0;
        const dispose = effect(() => {
            if (condition()) {
                sigA();
            }
            else {
                sigB();
            }
            callCount++;
        });
        for (let i = 0; i < 1_000; i++) {
            if (i % 10 === 0) {
                condition.set(!condition());
            }
            else if (condition()) {
                sigA.set(i);
            }
            else {
                sigB.set(i);
            }
        }
        dispose();
    },
};
/**
 * Effect with root scope.
 */
export const effectInRoot = {
    name: 'effect-in-root-1k',
    iterations: 50,
    fn: async () => {
        for (let i = 0; i < 1_000; i++) {
            createRoot(dispose => {
                const sig = signal(0);
                effect(() => {
                    sig();
                });
                sig.set(1);
                dispose();
            });
        }
    },
};
/**
 * Many effects on same signal.
 */
export const manyEffectsSameSignal = {
    name: 'many-effects-same-signal-1k',
    iterations: 20,
    fn: async () => {
        const sig = signal(0);
        const disposes = [];
        // Create 1000 effects all watching the same signal
        for (let i = 0; i < 1_000; i++) {
            const dispose = effect(() => {
                sig();
            });
            disposes.push(dispose);
        }
        // Update the signal
        for (let i = 0; i < 100; i++) {
            sig.set(i);
        }
        // Cleanup
        for (const dispose of disposes) {
            dispose();
        }
    },
};
/**
 * Effect execution order verification.
 */
export const effectExecutionOrder = {
    name: 'effect-execution-order-1k',
    iterations: 50,
    fn: async () => {
        const sig1 = signal(0);
        const sig2 = signal(0);
        const executionLog = [];
        const dispose1 = effect(() => {
            sig1();
            executionLog.push('effect1');
        });
        const dispose2 = effect(() => {
            sig2();
            executionLog.push('effect2');
        });
        const dispose3 = effect(() => {
            sig1();
            sig2();
            executionLog.push('effect3');
        });
        for (let i = 0; i < 1_000; i++) {
            sig1.set(i);
            sig2.set(i);
        }
        dispose1();
        dispose2();
        dispose3();
    },
};
export const effectBenchmarks = [
    create10kEffects,
    create1kEffects,
    effectSingleDependency,
    effectMultipleDependencies,
    effectCleanup,
    effectDisposal,
    nestedEffects,
    conditionalDependencies,
    effectInRoot,
    manyEffectsSameSignal,
    effectExecutionOrder,
];
export default effectBenchmarks;
//# sourceMappingURL=effects.js.map