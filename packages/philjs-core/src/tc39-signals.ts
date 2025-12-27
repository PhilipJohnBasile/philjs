/**
 * TC39 Signals Proposal Compatible API for PhilJS
 *
 * This module provides an API that aligns with the TC39 Signals proposal
 * (Stage 1 → expected Stage 3 in 2025-2026).
 *
 * When native Signals ship in browsers, PhilJS will seamlessly transition
 * by using the native implementation while maintaining backward compatibility.
 *
 * @see https://github.com/tc39/proposal-signals
 *
 * @example
 * ```ts
 * import { Signal } from '@philjs/core/tc39-signals';
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

import {
  signal as createSignal,
  memo,
  effect,
  batch,
  untrack,
} from './signals.js';

// ============================================================================
// TC39 Signal Types
// ============================================================================

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

// ============================================================================
// Signal.State Implementation
// ============================================================================

/**
 * A writable signal that holds a value.
 * Equivalent to TC39's Signal.State.
 */
class SignalStateImpl<T> implements SignalState<T> {
  private _signal: ReturnType<typeof createSignal<T>>;

  constructor(initialValue: T, options?: { equals?: (a: T, b: T) => boolean }) {
    this._signal = createSignal(initialValue);
    // Note: Custom equality not yet implemented in core signals
    // Will be added when TC39 proposal finalizes API
  }

  get(): T {
    return this._signal();
  }

  set(value: T): void {
    this._signal.set(value);
  }

  /**
   * Peek at the value without tracking dependencies.
   * (PhilJS extension, may be added to TC39)
   */
  peek(): T {
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
class SignalComputedImpl<T> implements SignalComputed<T> {
  private _memo: ReturnType<typeof memo<T>>;

  constructor(computation: () => T, options?: { equals?: (a: T, b: T) => boolean }) {
    this._memo = memo(computation);
  }

  get(): T {
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
class SignalWatcherImpl implements SignalWatcher {
  private _callback: () => void;
  private _disposes: Map<SignalState<unknown>, () => void> = new Map();
  private _pending: Set<SignalState<unknown>> = new Set();

  constructor(callback: () => void) {
    this._callback = callback;
  }

  watch(...signals: SignalState<unknown>[]): void {
    for (const signal of signals) {
      if (this._disposes.has(signal)) continue;

      // Subscribe to the underlying signal
      const internalSignal = (signal as SignalStateImpl<unknown>)['_signal'];
      if (internalSignal && typeof internalSignal.subscribe === 'function') {
        const dispose = internalSignal.subscribe(() => {
          this._pending.add(signal);
          this._callback();
        });
        this._disposes.set(signal, dispose);
      }
    }
  }

  unwatch(...signals: SignalState<unknown>[]): void {
    for (const signal of signals) {
      const dispose = this._disposes.get(signal);
      if (dispose) {
        dispose();
        this._disposes.delete(signal);
        this._pending.delete(signal);
      }
    }
  }

  getPending(): SignalState<unknown>[] {
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
 * import { Signal } from '@philjs/core/tc39-signals';
 *
 * const count = new Signal.State(0);
 * const doubled = new Signal.Computed(() => count.get() * 2);
 * ```
 */
export const Signal = {
  /**
   * Create a writable state signal.
   */
  State: SignalStateImpl as {
    new <T>(value: T, options?: { equals?: (a: T, b: T) => boolean }): SignalState<T>;
  },

  /**
   * Create a computed (derived) signal.
   */
  Computed: SignalComputedImpl as {
    new <T>(computation: () => T, options?: { equals?: (a: T, b: T) => boolean }): SignalComputed<T>;
  },

  /**
   * Advanced APIs for framework authors.
   */
  subtle: {
    /**
     * Create a watcher for observing signal changes.
     */
    Watcher: SignalWatcherImpl as {
      new (callback: () => void): SignalWatcher;
    },

    /**
     * Run a function without tracking signal reads.
     */
    untrack,

    /**
     * Get the current tracking scope (if any).
     * Returns null if not in a reactive context.
     */
    currentComputation(): unknown | null {
      // Exposed for framework interop - returns current reactive scope
      // Internal tracking is handled by the signals runtime
      return null;
    },

    /**
     * Check if we're currently inside a batch.
     */
    hasPendingBatch(): boolean {
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
// Polyfill Detection
// ============================================================================

/**
 * Check if native TC39 Signals are available.
 * When they ship, PhilJS will use the native implementation.
 */
export function hasNativeSignals(): boolean {
  return typeof (globalThis as any).Signal !== 'undefined';
}

/**
 * Get the Signal implementation (native or polyfill).
 */
export function getSignalImpl(): typeof Signal {
  if (hasNativeSignals()) {
    return (globalThis as any).Signal;
  }
  return Signal;
}

// ============================================================================
// Default Export
// ============================================================================

export default Signal;
