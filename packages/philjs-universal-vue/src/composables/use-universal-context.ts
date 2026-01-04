/**
 * Vue Composable for Universal Context
 *
 * This composable provides access to Universal Context values from within
 * Vue components, bridging PhilJS's context system with Vue's reactivity.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useUniversalContext } from '@philjs/universal-vue/composables';
 *
 * // Get a context value as a computed ref
 * const theme = useUniversalContext<'light' | 'dark'>('theme');
 * const user = useUniversalContext<User>('currentUser');
 * </script>
 *
 * <template>
 *   <div :class="theme">
 *     <p v-if="user">Welcome, {{ user.name }}!</p>
 *   </div>
 * </template>
 * ```
 */

import {
  computed,
  shallowRef,
  onUnmounted,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
} from 'vue';
import type { SignalBridge } from '../types.js';

/**
 * Universal Context interface
 */
interface UniversalContext<T> {
  get(): T | undefined;
  set(value: T): void;
  subscribe(callback: (value: T | undefined) => void): () => void;
  hasValue(): boolean;
  reset(): void;
}

/**
 * Context bridge instance interface
 */
interface ContextBridgeInstance {
  getContext<T>(id: string): UniversalContext<T> | undefined;
  createContext<T>(id: string, defaultValue?: T): UniversalContext<T>;
  hasContext(id: string): boolean;
}

// Global context storage
const globalContexts = new Map<string, UniversalContext<unknown>>();

/**
 * Get or create the global context bridge
 */
function getGlobalContextBridge(): ContextBridgeInstance {
  return {
    getContext<T>(id: string): UniversalContext<T> | undefined {
      return globalContexts.get(id) as UniversalContext<T> | undefined;
    },
    createContext<T>(id: string, defaultValue?: T): UniversalContext<T> {
      if (globalContexts.has(id)) {
        return globalContexts.get(id) as UniversalContext<T>;
      }
      const context = createUniversalContext<T>(id, defaultValue);
      return context;
    },
    hasContext(id: string): boolean {
      return globalContexts.has(id);
    },
  };
}

/**
 * Create a universal context
 */
function createUniversalContext<T>(id: string, defaultValue?: T): UniversalContext<T> {
  let value: T | undefined = defaultValue;
  const subscribers = new Set<(value: T | undefined) => void>();

  const context: UniversalContext<T> = {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
      subscribers.forEach((cb) => cb(value));
    },
    subscribe: (callback: (value: T | undefined) => void) => {
      subscribers.add(callback);
      callback(value);
      return () => subscribers.delete(callback);
    },
    hasValue: () => value !== undefined,
    reset: () => {
      value = undefined;
      subscribers.forEach((cb) => cb(undefined));
    },
  };

  globalContexts.set(id, context as UniversalContext<unknown>);
  return context;
}

/**
 * Injection key for the PhilJS context bridge
 */
export const UNIVERSAL_CONTEXT_KEY: InjectionKey<Map<string, UniversalContext<unknown>>> =
  Symbol('universal-context');

/**
 * Access a Universal Context value as a Vue computed ref.
 *
 * The returned computed ref will automatically update when the
 * context value changes, and will return undefined if the context
 * doesn't exist.
 *
 * @param id - The context identifier
 * @returns A computed ref containing the context value or undefined
 *
 * @example
 * ```ts
 * import { useUniversalContext } from '@philjs/universal-vue/composables';
 *
 * // Type-safe context access
 * interface ThemeContext {
 *   mode: 'light' | 'dark';
 *   primaryColor: string;
 * }
 *
 * const theme = useUniversalContext<ThemeContext>('app:theme');
 *
 * // Access in template: {{ theme?.mode }}
 * // Or with optional chaining: theme.value?.primaryColor
 * ```
 */
export function useUniversalContext<T>(id: string): ComputedRef<T | undefined> {
  // Get the global context bridge
  const contextBridge = getGlobalContextBridge();

  // Try to get or create the context
  const context = contextBridge.getContext<T>(id);

  // Create a reactive ref to hold the current value
  const valueRef = shallowRef<T | undefined>(context?.get());

  // Subscribe to context changes if context exists
  let unsubscribe: (() => void) | undefined;

  if (context) {
    unsubscribe = context.subscribe((newValue: T | undefined) => {
      valueRef.value = newValue;
    });
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe?.();
  });

  // Return a computed ref for readonly access
  return computed(() => valueRef.value);
}

/**
 * Access a Universal Context value with a fallback default.
 *
 * Similar to useUniversalContext but returns the default value
 * instead of undefined when the context doesn't exist.
 *
 * @param id - The context identifier
 * @param defaultValue - Value to return if context doesn't exist
 * @returns A computed ref containing the context value or default
 *
 * @example
 * ```ts
 * const theme = useUniversalContextWithDefault('theme', 'light');
 * // theme.value is always 'light' | 'dark', never undefined
 * ```
 */
export function useUniversalContextWithDefault<T>(
  id: string,
  defaultValue: T
): ComputedRef<T> {
  const contextRef = useUniversalContext<T>(id);

  return computed(() => contextRef.value ?? defaultValue);
}

/**
 * Create and provide a Universal Context value.
 *
 * This composable creates a new context and provides it to both
 * the Universal Component Protocol and Vue's provide/inject system.
 *
 * @param id - The context identifier
 * @param initialValue - Initial value for the context
 * @returns An object with get, set, and subscribe methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { useProvideUniversalContext } from '@philjs/universal-vue/composables';
 *
 * const themeContext = useProvideUniversalContext('theme', 'light');
 *
 * function toggleTheme() {
 *   themeContext.set(themeContext.get() === 'light' ? 'dark' : 'light');
 * }
 * </script>
 * ```
 */
export function useProvideUniversalContext<T>(
  id: string,
  initialValue: T
): {
  get: () => T | undefined;
  set: (value: T) => void;
  subscribe: (callback: (value: T | undefined) => void) => () => void;
  reset: () => void;
} {
  // Create the universal context
  const context = createUniversalContext<T>(id, initialValue);

  // Also provide via Vue's provide/inject for Vue-only components
  const vueContextMap = inject(UNIVERSAL_CONTEXT_KEY, new Map());
  vueContextMap.set(id, context);
  provide(UNIVERSAL_CONTEXT_KEY, vueContextMap);

  // Cleanup on unmount
  onUnmounted(() => {
    context.reset();
    vueContextMap.delete(id);
    globalContexts.delete(id);
  });

  return {
    get: () => context.get(),
    set: (value: T) => context.set(value),
    subscribe: (callback: (value: T | undefined) => void) => context.subscribe(callback),
    reset: () => context.reset(),
  };
}

/**
 * Watch a Universal Context and execute a callback when it changes.
 *
 * @param id - The context identifier
 * @param callback - Function to call when context value changes
 * @param options - Watch options
 *
 * @example
 * ```ts
 * import { useWatchUniversalContext } from '@philjs/universal-vue/composables';
 *
 * useWatchUniversalContext('user', (user) => {
 *   if (user) {
 *     console.log('User logged in:', user.name);
 *   }
 * });
 * ```
 */
export function useWatchUniversalContext<T>(
  id: string,
  callback: (value: T | undefined, oldValue: T | undefined) => void,
  options: { immediate?: boolean } = {}
): () => void {
  const { immediate = false } = options;

  const contextBridge = getGlobalContextBridge();
  const context = contextBridge.getContext<T>(id);

  if (!context) {
    if (immediate) {
      callback(undefined, undefined);
    }
    return () => {};
  }

  let oldValue: T | undefined = immediate ? undefined : context.get();

  if (immediate) {
    callback(context.get(), undefined);
  }

  const unsubscribe = context.subscribe((newValue: T | undefined) => {
    callback(newValue, oldValue);
    oldValue = newValue;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return unsubscribe;
}

/**
 * Check if a Universal Context exists and has a value.
 *
 * @param id - The context identifier
 * @returns A computed ref indicating if the context has a value
 *
 * @example
 * ```ts
 * const hasAuth = useHasUniversalContext('auth');
 *
 * // In template:
 * // <AuthenticatedContent v-if="hasAuth" />
 * ```
 */
export function useHasUniversalContext(id: string): ComputedRef<boolean> {
  const contextBridge = getGlobalContextBridge();
  const context = contextBridge.getContext(id);

  const hasValue = shallowRef(context?.hasValue() ?? false);

  if (context) {
    const unsubscribe = context.subscribe((value: unknown) => {
      hasValue.value = value !== undefined;
    });

    onUnmounted(() => {
      unsubscribe();
    });
  }

  return computed(() => hasValue.value);
}

/**
 * Get multiple Universal Contexts at once.
 *
 * @param ids - Array of context identifiers
 * @returns A computed ref containing a record of context values
 *
 * @example
 * ```ts
 * const contexts = useUniversalContexts<{
 *   theme: 'light' | 'dark';
 *   user: User;
 *   locale: string;
 * }>(['theme', 'user', 'locale']);
 *
 * // contexts.value.theme, contexts.value.user, etc.
 * ```
 */
export function useUniversalContexts<T extends Record<string, unknown>>(
  ids: Array<keyof T & string>
): ComputedRef<Partial<T>> {
  const contextBridge = getGlobalContextBridge();
  const values = shallowRef<Partial<T>>({});

  const unsubscribes: Array<() => void> = [];

  // Set up subscriptions for each context
  for (const id of ids) {
    const context = contextBridge.getContext<T[typeof id]>(id);

    if (context) {
      // Set initial value
      values.value = {
        ...values.value,
        [id]: context.get(),
      };

      // Subscribe to changes
      const unsubscribe = context.subscribe((newValue: T[typeof id] | undefined) => {
        values.value = {
          ...values.value,
          [id]: newValue,
        };
      });

      unsubscribes.push(unsubscribe);
    }
  }

  // Cleanup all subscriptions
  onUnmounted(() => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  });

  return computed(() => values.value);
}
