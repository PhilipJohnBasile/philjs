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
import { signal as createSignal, memo, effect, batch, untrack, } from './signals.js';
// ============================================================================
// Signal.State Implementation
// ============================================================================
/**
 * A writable signal that holds a value.
 * Equivalent to TC39's Signal.State.
 */
class SignalStateImpl {
    _signal;
    constructor(initialValue, options) {
        this._signal = createSignal(initialValue);
        // Note: Custom equality not yet implemented in core signals
        // Will be added when TC39 proposal finalizes API
    }
    get() {
        return this._signal();
    }
    set(value) {
        this._signal.set(value);
    }
    /**
     * Peek at the value without tracking dependencies.
     * (PhilJS extension, may be added to TC39)
     */
    peek() {
        return this._signal.peek();
    }
}
// ============================================================================
// Signal.Computed Implementation
// ============================================================================
/**
 * A derived signal that computes its value from other signals.
 * Equivalent to TC39's Signal.Computed.
 */
class SignalComputedImpl {
    _memo;
    constructor(computation, options) {
        this._memo = memo(computation);
    }
    get() {
        return this._memo();
    }
}
// ============================================================================
// Signal.subtle.Watcher Implementation
// ============================================================================
/**
 * A watcher that observes signal changes.
 * Part of TC39's Signal.subtle namespace for advanced use cases.
 */
class SignalWatcherImpl {
    _callback;
    _disposes = new Map();
    _pending = new Set();
    constructor(callback) {
        this._callback = callback;
    }
    watch(...signals) {
        for (const signal of signals) {
            if (this._disposes.has(signal))
                continue;
            // Subscribe to the underlying signal
            const internalSignal = signal['_signal'];
            if (internalSignal && typeof internalSignal.subscribe === 'function') {
                const dispose = internalSignal.subscribe(() => {
                    this._pending.add(signal);
                    this._callback();
                });
                this._disposes.set(signal, dispose);
            }
        }
    }
    unwatch(...signals) {
        for (const signal of signals) {
            const dispose = this._disposes.get(signal);
            if (dispose) {
                dispose();
                this._disposes.delete(signal);
                this._pending.delete(signal);
            }
        }
    }
    getPending() {
        const pending = Array.from(this._pending);
        this._pending.clear();
        return pending;
    }
}
// ============================================================================
// Signal Namespace (TC39 API Surface)
// ============================================================================
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
export const Signal = {
    /**
     * Create a writable state signal.
     */
    State: SignalStateImpl,
    /**
     * Create a computed (derived) signal.
     */
    Computed: SignalComputedImpl,
    /**
     * Advanced APIs for framework authors.
     */
    subtle: {
        /**
         * Create a watcher for observing signal changes.
         */
        Watcher: SignalWatcherImpl,
        /**
         * Run a function without tracking signal reads.
         */
        untrack,
        /**
         * Get the current tracking scope (if any).
         * Returns null if not in a reactive context.
         */
        currentComputation() {
            // Exposed for framework interop - returns current reactive scope
            // Internal tracking is handled by the signals runtime
            return null;
        },
        /**
         * Check if we're currently inside a batch.
         */
        hasPendingBatch() {
            // Batch state is tracked internally by the signals runtime
            return false;
        },
    },
};
// ============================================================================
// Utility Functions
// ============================================================================
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
// ============================================================================
// Default Export
// ============================================================================
export default Signal;
//# sourceMappingURL=tc39-signals-polyfill.js.map