/**
 * Vue Composables for PhilJS Signals
 *
 * These composables bridge PhilJS signals with Vue's reactivity system,
 * allowing seamless use of signals in Vue components.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useSignal, useWritableSignal } from '@philjs/universal-vue/composables';
 * import { signal, memo } from '@philjs/core';
 *
 * // External signal
 * const count = signal(0);
 *
 * // Read-only ref synced with signal
 * const countRef = useSignal(count);
 *
 * // Writable ref with two-way sync
 * const writableCount = useWritableSignal(count);
 * </script>
 *
 * <template>
 *   <div>Count: {{ countRef }}</div>
 *   <input v-model.number="writableCount" type="number" />
 * </template>
 * ```
 */

import {
  shallowRef,
  readonly,
  onUnmounted,
  watch,
  type Ref,
} from 'vue';
import type { Signal, Memo } from '../types.js';

/**
 * A readonly Vue ref type
 */
export type ReadonlyRef<T> = Readonly<Ref<T>>;

/**
 * Create a readonly Vue ref that stays synchronized with a PhilJS signal or memo.
 *
 * The ref will automatically update when the signal changes, and will
 * properly unsubscribe when the component unmounts.
 *
 * @param signal - A PhilJS signal or memo to sync with
 * @returns A readonly Vue ref that mirrors the signal's value
 *
 * @example
 * ```ts
 * import { useSignal } from '@philjs/universal-vue/composables';
 * import { signal, memo } from '@philjs/core';
 *
 * // With a signal
 * const count = signal(0);
 * const countRef = useSignal(count); // Readonly<Ref<number>>
 *
 * // With a memo
 * const doubled = memo(() => count() * 2);
 * const doubledRef = useSignal(doubled); // Readonly<Ref<number>>
 *
 * // Use in template
 * console.log(countRef.value); // 0
 * count.set(5);
 * console.log(countRef.value); // 5
 * ```
 */
export function useSignal<T>(signal: Signal<T> | Memo<T>): ReadonlyRef<T> {
  // Use shallowRef for better performance with complex objects
  const valueRef = shallowRef<T>(signal());

  // Subscribe to signal changes
  const unsubscribe = signal.subscribe((newValue: T) => {
    valueRef.value = newValue;
  });

  // Cleanup subscription when component unmounts
  onUnmounted(() => {
    unsubscribe();
  });

  // Return readonly ref to prevent accidental mutations
  return readonly(valueRef) as ReadonlyRef<T>;
}

/**
 * Create a writable Vue ref that has two-way synchronization with a PhilJS signal.
 *
 * Changes to the ref will update the signal, and changes to the signal
 * will update the ref. Perfect for use with v-model.
 *
 * @param signal - A PhilJS signal to sync with (must be writable)
 * @returns A writable Vue ref with two-way binding to the signal
 *
 * @example
 * ```vue
 * <script setup>
 * import { useWritableSignal } from '@philjs/universal-vue/composables';
 * import { signal } from '@philjs/core';
 *
 * const name = signal('');
 * const nameRef = useWritableSignal(name);
 * </script>
 *
 * <template>
 *   <input v-model="nameRef" />
 *   <p>Hello, {{ nameRef }}!</p>
 * </template>
 * ```
 */
export function useWritableSignal<T>(signal: Signal<T>): Ref<T> {
  // Use shallowRef to avoid deep reactivity overhead
  const valueRef = shallowRef<T>(signal());

  // Track if we're in the middle of an update to prevent loops
  let isUpdatingFromSignal = false;
  let isUpdatingFromRef = false;

  // Subscribe to signal changes and update the ref
  const unsubscribe = signal.subscribe((newValue: T) => {
    if (!isUpdatingFromRef) {
      isUpdatingFromSignal = true;
      valueRef.value = newValue;
      isUpdatingFromSignal = false;
    }
  });

  // Watch the ref and update the signal when it changes
  const stopWatch = watch(
    valueRef,
    (newValue: T) => {
      if (!isUpdatingFromSignal) {
        isUpdatingFromRef = true;
        signal.set(newValue);
        isUpdatingFromRef = false;
      }
    },
    { flush: 'sync' } // Sync flush for immediate updates
  );

  // Cleanup when component unmounts
  onUnmounted(() => {
    unsubscribe();
    stopWatch();
  });

  return valueRef as Ref<T>;
}

/**
 * Create a Vue ref from a signal with a custom transformer.
 *
 * Useful when you need to transform the signal value before using it
 * in Vue, or when mapping between different value representations.
 *
 * @param signal - The PhilJS signal to read from
 * @param read - Transform function for reading values
 * @param write - Optional transform function for writing values
 * @returns A Vue ref with transformed values
 *
 * @example
 * ```ts
 * import { useTransformedSignal } from '@philjs/universal-vue/composables';
 * import { signal } from '@philjs/core';
 *
 * // Store cents, display dollars
 * const cents = signal(1000);
 * const dollars = useTransformedSignal(
 *   cents,
 *   (c) => c / 100,        // cents -> dollars
 *   (d) => Math.round(d * 100)  // dollars -> cents
 * );
 *
 * console.log(dollars.value); // 10
 * dollars.value = 25;
 * console.log(cents()); // 2500
 * ```
 */
export function useTransformedSignal<T, U>(
  signal: Signal<T>,
  read: (value: T) => U,
  write?: (value: U) => T
): Ref<U> {
  // Initialize with transformed value
  const valueRef = shallowRef<U>(read(signal()));

  let isUpdatingFromSignal = false;
  let isUpdatingFromRef = false;

  // Subscribe to signal changes
  const unsubscribe = signal.subscribe((newValue: T) => {
    if (!isUpdatingFromRef) {
      isUpdatingFromSignal = true;
      valueRef.value = read(newValue);
      isUpdatingFromSignal = false;
    }
  });

  // Watch ref changes if write transform is provided
  let stopWatch: (() => void) | undefined;

  if (write) {
    stopWatch = watch(
      valueRef,
      (newValue: U) => {
        if (!isUpdatingFromSignal) {
          isUpdatingFromRef = true;
          signal.set(write(newValue));
          isUpdatingFromRef = false;
        }
      },
      { flush: 'sync' }
    );
  }

  // Cleanup
  onUnmounted(() => {
    unsubscribe();
    stopWatch?.();
  });

  return valueRef as Ref<U>;
}

/**
 * Create a debounced two-way binding between a signal and a Vue ref.
 *
 * Changes from the ref to the signal are debounced, while changes
 * from the signal to the ref are immediate.
 *
 * @param signal - The PhilJS signal to sync with
 * @param delay - Debounce delay in milliseconds
 * @returns A writable Vue ref with debounced signal updates
 *
 * @example
 * ```vue
 * <script setup>
 * import { useDebouncedSignal } from '@philjs/universal-vue/composables';
 * import { signal } from '@philjs/core';
 *
 * const searchQuery = signal('');
 * const searchRef = useDebouncedSignal(searchQuery, 300);
 * </script>
 *
 * <template>
 *   <input v-model="searchRef" placeholder="Search..." />
 * </template>
 * ```
 */
export function useDebouncedSignal<T>(signal: Signal<T>, delay: number): Ref<T> {
  const valueRef = shallowRef<T>(signal());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isUpdatingFromSignal = false;

  // Subscribe to signal changes (immediate)
  const unsubscribe = signal.subscribe((newValue: T) => {
    if (!timeoutId) {
      isUpdatingFromSignal = true;
      valueRef.value = newValue;
      isUpdatingFromSignal = false;
    }
  });

  // Watch ref changes (debounced)
  const stopWatch = watch(
    valueRef,
    (newValue: T) => {
      if (isUpdatingFromSignal) return;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        signal.set(newValue);
        timeoutId = null;
      }, delay);
    },
    { flush: 'sync' }
  );

  // Cleanup
  onUnmounted(() => {
    unsubscribe();
    stopWatch();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return valueRef as Ref<T>;
}

/**
 * Create a throttled two-way binding between a signal and a Vue ref.
 *
 * @param signal - The PhilJS signal to sync with
 * @param limit - Throttle limit in milliseconds
 * @returns A writable Vue ref with throttled signal updates
 */
export function useThrottledSignal<T>(signal: Signal<T>, limit: number): Ref<T> {
  const valueRef = shallowRef<T>(signal());
  let lastUpdate = 0;
  let pendingUpdate: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isUpdatingFromSignal = false;

  // Subscribe to signal changes
  const unsubscribe = signal.subscribe((newValue: T) => {
    if (!timeoutId) {
      isUpdatingFromSignal = true;
      valueRef.value = newValue;
      isUpdatingFromSignal = false;
    }
  });

  // Watch ref changes (throttled)
  const stopWatch = watch(
    valueRef,
    (newValue: T) => {
      if (isUpdatingFromSignal) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;

      if (timeSinceLastUpdate >= limit) {
        // Enough time has passed, update immediately
        signal.set(newValue);
        lastUpdate = now;
      } else {
        // Throttle: schedule update
        pendingUpdate = newValue;

        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            if (pendingUpdate !== null) {
              signal.set(pendingUpdate);
              lastUpdate = Date.now();
              pendingUpdate = null;
            }
            timeoutId = null;
          }, limit - timeSinceLastUpdate);
        }
      }
    },
    { flush: 'sync' }
  );

  // Cleanup
  onUnmounted(() => {
    unsubscribe();
    stopWatch();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return valueRef as Ref<T>;
}
