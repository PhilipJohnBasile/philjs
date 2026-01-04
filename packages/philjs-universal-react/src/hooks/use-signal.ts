/**
 * React hooks for using PhilJS signals.
 * Provides concurrent-mode-safe signal subscription using useSyncExternalStore.
 */

import { useCallback, useDebugValue, useSyncExternalStore } from 'react';
import type { Signal, Memo } from '@philjs/core';
import type { UseSignalOptions, SignalStateTuple } from '../types.js';

/**
 * React hook to read a PhilJS signal value.
 * Uses useSyncExternalStore for React 18+ concurrent mode safety.
 *
 * @param signal - The PhilJS signal or memo to subscribe to
 * @returns The current value of the signal
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useSignal } from '@philjs/universal-react';
 *
 * const count = signal(0);
 *
 * function Counter() {
 *   const value = useSignal(count);
 *   return <div>Count: {value}</div>;
 * }
 * ```
 */
export function useSignal<T>(signal: Signal<T> | Memo<T>): T {
  // Subscribe function that returns an unsubscribe function
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      if (signal.subscribe) {
        return signal.subscribe(callback);
      }
      // Fallback for memos without subscribe
      return () => {};
    },
    [signal]
  );

  // Get the current value snapshot
  const getSnapshot = useCallback((): T => {
    // Use peek() for signals to avoid tracking in wrong context
    if ('peek' in signal && typeof signal.peek === 'function') {
      return signal.peek();
    }
    // For memos, call directly
    return signal();
  }, [signal]);

  // Server snapshot for SSR
  const getServerSnapshot = useCallback((): T => {
    return signal();
  }, [signal]);

  // Use React 18's useSyncExternalStore for concurrent-safe subscription
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Debug value for React DevTools
  useDebugValue(value);

  return value;
}

/**
 * React hook to read and write a PhilJS signal.
 * Returns a tuple similar to useState.
 *
 * @param signal - The PhilJS signal to subscribe to
 * @returns A tuple of [value, setValue] similar to useState
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useSignalState } from '@philjs/universal-react';
 *
 * const count = signal(0);
 *
 * function Counter() {
 *   const [value, setValue] = useSignalState(count);
 *
 *   return (
 *     <div>
 *       <span>Count: {value}</span>
 *       <button onClick={() => setValue(v => v + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignalState<T>(signal: Signal<T>): SignalStateTuple<T> {
  // Get the current value using useSignal
  const value = useSignal(signal);

  // Create a stable setter function
  const setValue = useCallback(
    (valueOrUpdater: T | ((prev: T) => T)) => {
      signal.set(valueOrUpdater);
    },
    [signal]
  );

  // Debug value for React DevTools
  useDebugValue([value, 'Signal']);

  return [value, setValue];
}

/**
 * React hook for reading multiple signals at once.
 * More efficient than calling useSignal multiple times.
 *
 * @param signals - Array of signals to subscribe to
 * @returns Array of current values
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useSignals } from '@philjs/universal-react';
 *
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * function FullName() {
 *   const [first, last] = useSignals([firstName, lastName]);
 *   return <div>Name: {first} {last}</div>;
 * }
 * ```
 */
export function useSignals<T extends Array<Signal<unknown> | Memo<unknown>>>(
  signals: [...T]
): { [K in keyof T]: T[K] extends Signal<infer V> | Memo<infer V> ? V : never } {
  // Subscribe to all signals
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      const unsubscribes = signals.map((signal) => {
        if (signal.subscribe) {
          return signal.subscribe(callback);
        }
        return () => {};
      });

      return () => {
        for (const unsubscribe of unsubscribes) {
          unsubscribe();
        }
      };
    },
    // Stringify signal references for stable comparison
    [signals]
  );

  // Get snapshot of all values
  const getSnapshot = useCallback(() => {
    return signals.map((signal) => {
      if ('peek' in signal && typeof signal.peek === 'function') {
        return (signal as Signal<unknown>).peek();
      }
      return signal();
    });
  }, [signals]);

  // Server snapshot
  const getServerSnapshot = useCallback(() => {
    return signals.map((signal) => signal());
  }, [signals]);

  const values = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return values as { [K in keyof T]: T[K] extends Signal<infer V> | Memo<infer V> ? V : never };
}

/**
 * React hook to compute a value from signals.
 * Similar to useMemo but recomputes when any signal changes.
 *
 * @param compute - Function that reads signals and returns a computed value
 * @param deps - Array of signals that the computation depends on
 * @returns The computed value
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useComputed } from '@philjs/universal-react';
 *
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * function FullName() {
 *   const fullName = useComputed(
 *     () => `${firstName()} ${lastName()}`,
 *     [firstName, lastName]
 *   );
 *   return <div>Name: {fullName}</div>;
 * }
 * ```
 */
export function useComputed<T>(
  compute: () => T,
  deps: Array<Signal<unknown> | Memo<unknown>>
): T {
  // Subscribe to all dependencies
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      const unsubscribes = deps.map((signal) => {
        if (signal.subscribe) {
          return signal.subscribe(callback);
        }
        return () => {};
      });

      return () => {
        for (const unsubscribe of unsubscribes) {
          unsubscribe();
        }
      };
    },
    [deps]
  );

  // Compute the value
  const getSnapshot = useCallback(() => compute(), [compute]);
  const getServerSnapshot = useCallback(() => compute(), [compute]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useDebugValue(value);

  return value;
}

/**
 * React hook that returns true if a signal's value passes a predicate.
 * Optimized to only re-render when the boolean result changes.
 *
 * @param signal - The signal to test
 * @param predicate - Function to test the signal value
 * @returns Boolean indicating if the predicate passes
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useSignalWhen } from '@philjs/universal-react';
 *
 * const count = signal(0);
 *
 * function ShowWhenPositive() {
 *   const isPositive = useSignalWhen(count, v => v > 0);
 *   if (!isPositive) return null;
 *   return <div>Count is positive!</div>;
 * }
 * ```
 */
export function useSignalWhen<T>(
  signal: Signal<T> | Memo<T>,
  predicate: (value: T) => boolean
): boolean {
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      if (signal.subscribe) {
        // Only notify when the predicate result changes
        let lastResult = predicate(signal());

        return signal.subscribe(() => {
          const newResult = predicate(signal());
          if (newResult !== lastResult) {
            lastResult = newResult;
            callback();
          }
        });
      }
      return () => {};
    },
    [signal, predicate]
  );

  const getSnapshot = useCallback(
    () => predicate(signal()),
    [signal, predicate]
  );

  const getServerSnapshot = useCallback(
    () => predicate(signal()),
    [signal, predicate]
  );

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
