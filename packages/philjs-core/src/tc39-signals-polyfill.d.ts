/**
 * TC39 Signals Proposal Compatible API for PhilJS (polyfill).
 *
 * This module provides an API that aligns with the TC39 Signals proposal
 * and is intended for environments without native Signals support.
 *
 * @see https://github.com/tc39/proposal-signals
 *
 * @example
 * ```ts
 * import { Signal } from '@philjs/core/tc39-signals-polyfill';
 *
 * // State signal (writable)
 * const count = new Signal.State(0);
 * console.log(count.get()); // 0
 * count.set(5);
 *
 * // Computed signal (derived)
 * const doubled = new Signal.Computed(() => count.get() * 2);
 * console.log(doubled.get()); // 10
 *
 * // Watcher for effects
 * const watcher = new Signal.subtle.Watcher(() => {
 *   console.log('Count changed:', count.get());
 * });
 * watcher.watch(count);
 * ```
 */
import { effect, batch, untrack } from './signals.js';
export interface SignalState<T> {
    get(): T;
    set(value: T): void;
}
export interface SignalComputed<T> {
    get(): T;
}
export interface SignalWatcher {
    watch(...signals: SignalState<unknown>[]): void;
    unwatch(...signals: SignalState<unknown>[]): void;
    getPending(): SignalState<unknown>[];
}
/**
 * TC39-compatible Signal namespace.
 *
 * @example
 * ```ts
 * import { Signal } from '@philjs/core/tc39-signals-polyfill';
 *
 * const count = new Signal.State(0);
 * const doubled = new Signal.Computed(() => count.get() * 2);
 * ```
 */
export declare const Signal: {
    /**
     * Create a writable state signal.
     */
    State: {
        new <T>(value: T, options?: {
            equals?: (a: T, b: T) => boolean;
        }): SignalState<T>;
    };
    /**
     * Create a computed (derived) signal.
     */
    Computed: {
        new <T>(computation: () => T, options?: {
            equals?: (a: T, b: T) => boolean;
        }): SignalComputed<T>;
    };
    /**
     * Advanced APIs for framework authors.
     */
    subtle: {
        /**
         * Create a watcher for observing signal changes.
         */
        Watcher: {
            new (callback: () => void): SignalWatcher;
        };
        /**
         * Run a function without tracking signal reads.
         */
        untrack: typeof untrack;
        /**
         * Get the current tracking scope (if any).
         * Returns null if not in a reactive context.
         */
        currentComputation(): unknown | null;
        /**
         * Check if we're currently inside a batch.
         */
        hasPendingBatch(): boolean;
    };
};
/**
 * Batch multiple signal updates.
 * TC39 may include this in Signal.subtle.
 */
export { batch };
/**
 * Create an effect that runs when dependencies change.
 * TC39 proposal leaves effects to userland, so this is a PhilJS extension.
 */
export { effect };
export default Signal;
//# sourceMappingURL=tc39-signals-polyfill.d.ts.map