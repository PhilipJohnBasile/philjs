/**
 * Zustand-style state management for PhilJS
 *
 * Provides a familiar Zustand API backed by PhilJS signals for fine-grained reactivity.
 * Features:
 * - Simple, minimal API
 * - Signal-based reactivity
 * - Middleware support (persist, devtools)
 * - Immer-style updates
 * - Subscriptions
 */

import { signal, batch, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export type StateCreator<T> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T;

export type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

export type GetState<T> = () => T;

export type Subscribe<T> = (listener: (state: T, prevState: T) => void) => () => void;

export type Destroy = () => void;

export interface StoreApi<T> {
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  destroy: Destroy;
}

export type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U, equals?: (a: U, b: U) => boolean): U;
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  destroy: Destroy;
};

export type Middleware<T> = (
  config: StateCreator<T>
) => StateCreator<T>;

// ============================================================================
// Core Store Implementation
// ============================================================================

/**
 * Create a Zustand-style store backed by PhilJS signals
 *
 * @example
 * ```ts
 * const useStore = createStore((set) => ({
 *   count: 0,
 *   increment: () => set((state) => ({ count: state.count + 1 })),
 *   decrement: () => set((state) => ({ count: state.count - 1 })),
 * }));
 *
 * // In components
 * function Counter() {
 *   const count = useStore(state => state.count);
 *   const increment = useStore(state => state.increment);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function createStore<T extends object>(
  createState: StateCreator<T>
): UseStore<T> {
  // Create the signal that holds the state
  const stateSignal = signal<T>({} as T);
  const listeners = new Set<(state: T, prevState: T) => void>();

  const api: StoreApi<T> = {
    setState: (partial, replace = false) => {
      const prevState = stateSignal();

      batch(() => {
        if (typeof partial === 'function') {
          const newState = partial(prevState);
          if (replace) {
            stateSignal.set(newState as T);
          } else {
            stateSignal.set({ ...prevState, ...newState });
          }
        } else {
          if (replace) {
            stateSignal.set(partial as T);
          } else {
            stateSignal.set({ ...prevState, ...partial });
          }
        }
      });

      const newState = stateSignal();

      // Notify listeners
      listeners.forEach(listener => {
        try {
          listener(newState, prevState);
        } catch (error) {
          console.error('Error in store listener:', error);
        }
      });
    },
    getState: () => stateSignal(),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      listeners.clear();
    },
  };

  // Initialize the store
  const initialState = createState(api.setState, api.getState, api);
  stateSignal.set(initialState);

  // Create the hook function
  const useStore = ((selector?: any, equals?: any) => {
    if (!selector) {
      // Return full state
      return stateSignal();
    }

    // Memoized selector
    const selected = selector(stateSignal());

    // Track this as a reactive dependency
    return selected;
  }) as UseStore<T>;

  // Attach API methods
  useStore.setState = api.setState;
  useStore.getState = api.getState;
  useStore.subscribe = api.subscribe;
  useStore.destroy = api.destroy;

  return useStore;
}

// ============================================================================
// Middleware: Persist
// ============================================================================

export interface PersistOptions<T> {
  name: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void | ((state?: T, error?: Error) => void);
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
}

/**
 * Persist middleware - saves state to localStorage/sessionStorage
 *
 * @example
 * ```ts
 * const useStore = createStore(
 *   persist(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((s) => ({ count: s.count + 1 })),
 *     }),
 *     {
 *       name: 'my-app-storage',
 *       storage: localStorage, // or sessionStorage
 *     }
 *   )
 * );
 * ```
 */
export function persist<T extends object>(
  config: StateCreator<T>,
  options: PersistOptions<T>
): StateCreator<T> {
  return (set, get, api) => {
    const {
      name,
      storage = typeof window !== 'undefined' ? localStorage : undefined,
      serialize = JSON.stringify,
      deserialize = JSON.parse,
      partialize = (state) => state,
      onRehydrateStorage,
      version = 0,
      migrate,
    } = options;

    // Load persisted state
    let persistedState: Partial<T> = {};

    if (storage) {
      try {
        const item = storage.getItem(name);
        if (item) {
          const parsed = deserialize(item);

          // Handle version migration
          if (migrate && parsed._version !== version) {
            persistedState = migrate(parsed, parsed._version || 0);
          } else {
            persistedState = parsed;
          }

          if (onRehydrateStorage) {
            const cb = onRehydrateStorage(persistedState as T);
            if (cb) {
              try {
                cb(persistedState as T);
              } catch (error) {
                cb(undefined, error as Error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load persisted state:', error);
      }
    }

    // Initialize state with persisted values
    const initialState = config(set, get, api);
    const hydratedState = { ...initialState, ...persistedState };

    // Wrap setState to persist changes
    const originalSet = api.setState;
    api.setState = (partial, replace) => {
      originalSet(partial, replace);

      // Persist to storage
      if (storage) {
        try {
          const state = get();
          const stateToStore = partialize(state);
          const serialized = serialize({
            ...stateToStore,
            _version: version,
          } as any);
          storage.setItem(name, serialized);
        } catch (error) {
          console.error('Failed to persist state:', error);
        }
      }
    };

    return hydratedState;
  };
}

// ============================================================================
// Middleware: DevTools
// ============================================================================

export interface DevToolsOptions {
  name?: string;
  enabled?: boolean;
  anonymousActionType?: string;
  store?: string;
}

/**
 * DevTools middleware - integrates with Redux DevTools Extension
 *
 * @example
 * ```ts
 * const useStore = createStore(
 *   devtools(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((s) => ({ count: s.count + 1 }), false, 'increment'),
 *     }),
 *     { name: 'MyStore' }
 *   )
 * );
 * ```
 */
export function devtools<T extends object>(
  config: StateCreator<T>,
  options: DevToolsOptions = {}
): StateCreator<T> {
  return (set, get, api) => {
    const {
      name = 'PhilJS Store',
      enabled = typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__,
      anonymousActionType = 'anonymous',
    } = options;

    let extension: any;

    if (enabled && typeof window !== 'undefined') {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
      if (devTools) {
        extension = devTools.connect({ name });
      }
    }

    const initialState = config(set, get, api);

    if (extension) {
      extension.init(initialState);

      // Wrap setState to send actions to devtools
      const originalSet = api.setState;
      api.setState = (partial: any, replace?: boolean, actionName?: string) => {
        originalSet(partial, replace);

        const actionType = actionName || anonymousActionType;
        const state = get();

        extension.send({ type: actionType, payload: partial }, state);
      };

      // Subscribe to devtools actions (time travel, etc.)
      extension.subscribe((message: any) => {
        if (message.type === 'DISPATCH' && message.state) {
          try {
            const newState = JSON.parse(message.state);
            api.setState(newState, true);
          } catch (error) {
            console.error('Failed to apply devtools state:', error);
          }
        }
      });
    }

    return initialState;
  };
}

// ============================================================================
// Middleware: Immer
// ============================================================================

/**
 * Immer-style middleware for immutable updates with mutable syntax
 * Note: This is a lightweight version. For full Immer support, use the actual Immer library.
 *
 * @example
 * ```ts
 * const useStore = createStore(
 *   immer((set) => ({
 *     nested: { count: 0 },
 *     increment: () => set((state) => {
 *       state.nested.count++; // Mutable syntax!
 *     }),
 *   }))
 * );
 * ```
 */
export function immer<T extends object>(
  config: StateCreator<T>
): StateCreator<T> {
  return (set, get, api) => {
    const immerSet: SetState<T> = (partial, replace) => {
      if (typeof partial === 'function') {
        // Create a draft-like proxy
        set((state) => {
          const draft = createDraft(state);
          const result = partial(draft as T);

          // If function returns a value, use it; otherwise use the mutated draft
          return result !== undefined ? result : draft;
        }, replace);
      } else {
        set(partial, replace);
      }
    };

    return config(immerSet, get, api);
  };
}

/**
 * Simple draft proxy (not a full Immer implementation)
 */
function createDraft<T>(state: T): T {
  if (typeof state !== 'object' || state === null) {
    return state;
  }

  if (Array.isArray(state)) {
    return [...state] as T;
  }

  return { ...state };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Shallow equality comparison for selectors
 */
export function shallow<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as any)[key], (b as any)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Combine multiple stores into one
 *
 * @example
 * ```ts
 * const useUserStore = createStore(/* ... *\\/);
 * const useCartStore = createStore(/* ... *\\/);
 *
 * const useCombinedStore = combine({
 *   user: useUserStore,
 *   cart: useCartStore,
 * });
 * ```
 */
export function combine<T extends Record<string, UseStore<any>>>(
  stores: T
): UseStore<{ [K in keyof T]: ReturnType<T[K]> }> {
  type CombinedState = { [K in keyof T]: ReturnType<T[K]> };

  const useStore = createStore<CombinedState>((set, get) => {
    const initialState = {} as CombinedState;

    for (const key in stores) {
      const store = stores[key];
      if (store) {
        initialState[key] = store.getState();

        // Subscribe to individual stores
        store.subscribe((state) => {
          set((prev) => ({ ...prev, [key]: state }));
        });
      }
    }

    return initialState;
  });

  return useStore;
}

/**
 * Create a store slice
 *
 * @example
 * ```ts
 * const createUserSlice = (set, get) => ({
 *   name: '',
 *   setName: (name) => set({ name }),
 * });
 *
 * const createCartSlice = (set, get) => ({
 *   items: [],
 *   addItem: (item) => set((s) => ({ items: [...s.items, item] })),
 * });
 *
 * const useStore = createStore((set, get, api) => ({
 *   ...createUserSlice(set, get, api),
 *   ...createCartSlice(set, get, api),
 * }));
 * ```
 */
export function createSlice<T extends object>(
  slice: StateCreator<T>
): StateCreator<T> {
  return slice;
}
