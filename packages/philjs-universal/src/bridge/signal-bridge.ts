/**
 * Signal Bridge Implementation
 * Bridges PhilJS signals to other reactive systems.
 */

import { signal, effect, batch } from '@philjs/core';
import type { Signal, Memo } from '@philjs/core';
import type { SignalBridge, SignalBridgeOptions } from '../types.js';

/**
 * Create a new signal bridge with an initial value.
 * The bridge provides a unified API that works across frameworks.
 */
export function createSignalBridge<T>(
  initialValue: T,
  options: SignalBridgeOptions<T> = {}
): SignalBridge<T> {
  const { equals = Object.is, name } = options;

  const internalSignal = signal(initialValue);
  const subscribers = new Set<(value: T) => void>();
  let isUpdating = false;

  // Track changes to notify external subscribers
  const disposeEffect = effect(() => {
    const value = internalSignal();
    if (!isUpdating) {
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          console.error(`[SignalBridge${name ? `: ${name}` : ''}] Subscriber error:`, error);
        }
      }
    }
  });

  const bridge: SignalBridge<T> = {
    peek: () => internalSignal.peek(),

    get: () => internalSignal(),

    set: (valueOrUpdater) => {
      const currentValue = internalSignal.peek();
      const newValue = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(currentValue)
        : valueOrUpdater;

      if (!equals(currentValue, newValue)) {
        isUpdating = true;
        internalSignal.set(newValue);
        isUpdating = false;
      }
    },

    subscribe: (callback) => {
      subscribers.add(callback);
      // Immediately notify with current value
      callback(internalSignal.peek());
      return () => {
        subscribers.delete(callback);
      };
    },

    toReactive: () => internalSignal,

    isPhilJSSignal: () => true,
  };

  return bridge;
}

/**
 * Bridge an existing PhilJS signal to the universal interface.
 * This wraps a signal without creating a new one.
 */
export function bridgeSignal<T>(
  philSignal: Signal<T>,
  options: SignalBridgeOptions<T> = {}
): SignalBridge<T> {
  const { equals = Object.is, name } = options;
  const subscribers = new Set<(value: T) => void>();
  let isUpdating = false;

  // Track changes from the original signal
  const disposeEffect = effect(() => {
    const value = philSignal();
    if (!isUpdating) {
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          console.error(`[SignalBridge${name ? `: ${name}` : ''}] Subscriber error:`, error);
        }
      }
    }
  });

  const bridge: SignalBridge<T> = {
    peek: () => philSignal.peek(),

    get: () => philSignal(),

    set: (valueOrUpdater) => {
      const currentValue = philSignal.peek();
      const newValue = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(currentValue)
        : valueOrUpdater;

      if (!equals(currentValue, newValue)) {
        isUpdating = true;
        philSignal.set(newValue);
        isUpdating = false;
      }
    },

    subscribe: (callback) => {
      subscribers.add(callback);
      // Immediately notify with current value
      callback(philSignal.peek());
      return () => {
        subscribers.delete(callback);
      };
    },

    toReactive: () => philSignal,

    isPhilJSSignal: () => true,
  };

  return bridge;
}

/**
 * Bridge a memo/computed value (read-only).
 * Since memos are read-only, set() will throw an error.
 */
export function bridgeMemo<T>(
  memo: Memo<T>,
  options: SignalBridgeOptions<T> = {}
): Omit<SignalBridge<T>, 'set'> & { readonly: true } {
  const { name } = options;
  const subscribers = new Set<(value: T) => void>();

  // Track changes from the memo
  const disposeEffect = effect(() => {
    const value = memo();
    for (const subscriber of subscribers) {
      try {
        subscriber(value);
      } catch (error) {
        console.error(`[MemoBridge${name ? `: ${name}` : ''}] Subscriber error:`, error);
      }
    }
  });

  return {
    readonly: true as const,

    peek: () => {
      // Memos may not have peek, access without tracking
      return memo();
    },

    get: () => memo(),

    subscribe: (callback) => {
      subscribers.add(callback);
      callback(memo());
      return () => {
        subscribers.delete(callback);
      };
    },

    toReactive: () => memo,

    isPhilJSSignal: () => true,
  };
}

/**
 * Create a bridge from an external reactive source.
 * Useful for bridging React state, Vue refs, etc. to PhilJS.
 */
export interface ExternalReactiveSource<T> {
  /** Get current value */
  get(): T;
  /** Subscribe to changes */
  subscribe(callback: (value: T) => void): () => void;
  /** Set value (optional for read-only sources) */
  set?(value: T): void;
}

export function bridgeExternal<T>(
  source: ExternalReactiveSource<T>,
  options: SignalBridgeOptions<T> = {}
): SignalBridge<T> {
  const { equals = Object.is, name } = options;

  // Create an internal signal that mirrors the external source
  const internalSignal = signal(source.get());
  let isUpdating = false;

  // Subscribe to external changes
  const unsubscribeExternal = source.subscribe((value) => {
    if (!isUpdating) {
      isUpdating = true;
      internalSignal.set(value);
      isUpdating = false;
    }
  });

  const subscribers = new Set<(value: T) => void>();

  // Track internal signal changes
  const disposeEffect = effect(() => {
    const value = internalSignal();
    if (!isUpdating) {
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          console.error(`[ExternalBridge${name ? `: ${name}` : ''}] Subscriber error:`, error);
        }
      }
    }
  });

  const bridge: SignalBridge<T> = {
    peek: () => internalSignal.peek(),

    get: () => internalSignal(),

    set: (valueOrUpdater) => {
      if (!source.set) {
        throw new Error(`[ExternalBridge${name ? `: ${name}` : ''}] Source is read-only`);
      }

      const currentValue = internalSignal.peek();
      const newValue = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(currentValue)
        : valueOrUpdater;

      if (!equals(currentValue, newValue)) {
        isUpdating = true;
        source.set(newValue);
        internalSignal.set(newValue);
        isUpdating = false;
      }
    },

    subscribe: (callback) => {
      subscribers.add(callback);
      callback(internalSignal.peek());
      return () => {
        subscribers.delete(callback);
      };
    },

    toReactive: () => internalSignal,

    isPhilJSSignal: () => false,
  };

  return bridge;
}

/**
 * Batch multiple signal bridge updates together.
 * Prevents intermediate renders.
 */
export function batchBridgeUpdates<T>(fn: () => T): T {
  return batch(fn);
}

/**
 * Resolve a value that might be a signal to its raw value.
 */
export function resolveValue<T>(value: T | Signal<T> | Memo<T>): T {
  if (typeof value === 'function' && 'subscribe' in value) {
    return (value as Signal<T> | Memo<T>)();
  }
  return value as T;
}

/**
 * Resolve all signal values in a props object.
 */
export function resolveProps<Props extends Record<string, unknown>>(
  props: Props
): { [K in keyof Props]: Props[K] extends Signal<infer T> | Memo<infer T> ? T : Props[K] } {
  const resolved = {} as Record<string, unknown>;

  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolveValue(value);
  }

  return resolved as { [K in keyof Props]: Props[K] extends Signal<infer T> | Memo<infer T> ? T : Props[K] };
}
