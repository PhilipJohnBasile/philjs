/**
 * Reactive Store - Deep reactive state management
 *
 * SolidJS-inspired store with:
 * - Deep reactivity with path-based updates
 * - Immutable update patterns
 * - Proxy-based tracking
 * - Transactional updates
 * - Time-travel debugging
 * - Persistence
 */

import { signal, batch, untrack } from './signals.js';
import type { Signal } from './types.js';

// =============================================================================
// Types
// =============================================================================

export type StoreNode = Record<string | number | symbol, any>;

export type Store<T extends StoreNode> = T;

export type SetStoreFunction<T extends StoreNode> = {
  <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])): void;
  <K extends keyof T, K2 extends keyof T[K]>(
    key: K,
    key2: K2,
    value: T[K][K2] | ((prev: T[K][K2]) => T[K][K2])
  ): void;
  <K extends keyof T, K2 extends keyof T[K], K3 extends keyof T[K][K2]>(
    key: K,
    key2: K2,
    key3: K3,
    value: T[K][K2][K3] | ((prev: T[K][K2][K3]) => T[K][K2][K3])
  ): void;
  (...path: any[]): void;
};

export interface StoreOptions<T extends StoreNode> {
  /** Store name for debugging */
  name?: string;
  /** Enable time-travel debugging */
  devtools?: boolean;
  /** Persistence configuration */
  persist?: PersistConfig<T>;
  /** Middleware functions */
  middleware?: StoreMiddleware<T>[];
  /** Maximum history size for undo/redo */
  historyLimit?: number;
}

export interface PersistConfig<T> {
  /** Storage key */
  key: string;
  /** Storage backend */
  storage?: Storage;
  /** Serializer */
  serialize?: (state: T) => string;
  /** Deserializer */
  deserialize?: (data: string) => T;
  /** Paths to persist (if not specified, persist all) */
  paths?: string[];
  /** Debounce persistence in ms */
  debounce?: number;
}

export type StoreMiddleware<T extends StoreNode> = (
  state: T,
  path: (string | number | symbol)[],
  value: any,
  prevValue: any
) => void;

export interface StoreSnapshot<T> {
  timestamp: number;
  state: T;
  action?: string;
}

// =============================================================================
// Store Implementation
// =============================================================================

const STORE_NODE = Symbol('store-node');
const STORE_PATH = Symbol('store-path');
const STORE_SETTER = Symbol('store-setter');

/**
 * Create a reactive store with deep reactivity
 */
export function createStore<T extends StoreNode>(
  initialState: T,
  options: StoreOptions<T> = {}
): [Store<T>, SetStoreFunction<T>] {
  const signals = new Map<string, Signal<any>>();
  const history: StoreSnapshot<T>[] = [];
  const historyLimit = options.historyLimit ?? 100;
  let historyIndex = -1;
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;

  // Load persisted state
  if (options.persist) {
    const stored = loadPersistedState(options.persist);
    if (stored) {
      initialState = mergeState(initialState, stored, options.persist.paths);
    }
  }

  // Deep clone initial state
  let state = structuredClone(initialState);

  // Save initial snapshot
  if (options.devtools) {
    saveSnapshot('@@INIT');
  }

  /**
   * Get or create signal for a path
   */
  function getSignal(path: string): Signal<any> {
    let sig = signals.get(path);
    if (!sig) {
      const value = getValueAtPath(state, path);
      sig = signal(value);
      signals.set(path, sig);
    }
    return sig;
  }

  /**
   * Update signals affected by a change
   */
  function notifySignals(changedPath: string): void {
    // Notify the exact path
    const sig = signals.get(changedPath);
    if (sig) {
      sig.set(getValueAtPath(state, changedPath));
    }

    // Notify parent paths (for object references)
    const parts = changedPath.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      const parentSig = signals.get(parentPath);
      if (parentSig) {
        parentSig.set(getValueAtPath(state, parentPath));
      }
    }

    // Notify child paths
    for (const [path, pathSig] of signals) {
      if (path.startsWith(changedPath + '.')) {
        pathSig.set(getValueAtPath(state, path));
      }
    }
  }

  /**
   * Set value at path
   */
  function setValueAtPath(
    obj: any,
    path: (string | number | symbol)[],
    value: any
  ): void {
    const pathStr = path.map(String).join('.');
    const prevValue = getValueAtPath(state, pathStr);

    // Apply value (handle updater functions)
    const newValue = typeof value === 'function' ? value(prevValue) : value;

    // Update state
    let current = state as any;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = newValue;

    // Call middleware
    if (options.middleware) {
      for (const mw of options.middleware) {
        mw(state, path, newValue, prevValue);
      }
    }

    // Notify signals
    batch(() => {
      notifySignals(pathStr);
    });

    // Persist
    if (options.persist) {
      schedulePersist();
    }
  }

  /**
   * Create proxy for a value
   */
  function createProxy(value: any, path: (string | number | symbol)[] = []): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return createArrayProxy(value, path);
    }

    return new Proxy(value, {
      get(target, prop) {
        if (prop === STORE_NODE) return true;
        if (prop === STORE_PATH) return path;

        const newPath = [...path, prop];
        const pathStr = newPath.map(String).join('.');

        // Track access
        const sig = getSignal(pathStr);
        sig(); // Subscribe to signal

        const val = target[prop];
        if (val !== null && typeof val === 'object') {
          return createProxy(val, newPath);
        }
        return val;
      },

      set(target, prop, value) {
        setValueAtPath(target, [...path, prop], value);
        return true;
      },

      has(target, prop) {
        return prop in target;
      },

      ownKeys(target) {
        return Reflect.ownKeys(target);
      },

      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  /**
   * Create array proxy with reactive methods
   */
  function createArrayProxy(arr: any[], path: (string | number | symbol)[]): any[] {
    return new Proxy(arr, {
      get(target, prop) {
        if (prop === STORE_NODE) return true;
        if (prop === STORE_PATH) return path;
        if (prop === 'length') {
          const sig = getSignal([...path, 'length'].map(String).join('.'));
          sig();
          return target.length;
        }

        // Array methods that mutate
        if (prop === 'push') {
          return (...items: any[]) => {
            batch(() => {
              const result = target.push(...items);
              notifySignals(path.map(String).join('.'));
              return result;
            });
          };
        }

        if (prop === 'pop') {
          return () => {
            return batch(() => {
              const result = target.pop();
              notifySignals(path.map(String).join('.'));
              return result;
            });
          };
        }

        if (prop === 'splice') {
          return (start: number, deleteCount?: number, ...items: any[]) => {
            return batch(() => {
              const result = target.splice(start, deleteCount!, ...items);
              notifySignals(path.map(String).join('.'));
              return result;
            });
          };
        }

        if (prop === 'shift') {
          return () => {
            return batch(() => {
              const result = target.shift();
              notifySignals(path.map(String).join('.'));
              return result;
            });
          };
        }

        if (prop === 'unshift') {
          return (...items: any[]) => {
            return batch(() => {
              const result = target.unshift(...items);
              notifySignals(path.map(String).join('.'));
              return result;
            });
          };
        }

        if (prop === 'sort') {
          return (compareFn?: (a: any, b: any) => number) => {
            return batch(() => {
              target.sort(compareFn);
              notifySignals(path.map(String).join('.'));
              return createArrayProxy(target, path);
            });
          };
        }

        if (prop === 'reverse') {
          return () => {
            return batch(() => {
              target.reverse();
              notifySignals(path.map(String).join('.'));
              return createArrayProxy(target, path);
            });
          };
        }

        // Index access
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          const index = Number(prop);
          const newPath = [...path, index];
          const pathStr = newPath.map(String).join('.');
          const sig = getSignal(pathStr);
          sig();

          const val = target[index];
          if (val !== null && typeof val === 'object') {
            return createProxy(val, newPath);
          }
          return val;
        }

        return Reflect.get(target, prop);
      },

      set(target, prop, value) {
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          setValueAtPath(target, [...path, Number(prop)], value);
        } else {
          setValueAtPath(target, [...path, prop], value);
        }
        return true;
      },
    });
  }

  /**
   * Set store function
   */
  const setStore: SetStoreFunction<T> = (...args: any[]) => {
    const value = args.pop();
    const path = args as (string | number | symbol)[];
    setValueAtPath(state, path, value);

    if (options.devtools) {
      saveSnapshot(`SET ${path.join('.')}`);
    }
  };

  /**
   * Save snapshot for time-travel
   */
  function saveSnapshot(action?: string): void {
    // Remove future history if we're not at the end
    if (historyIndex < history.length - 1) {
      history.splice(historyIndex + 1);
    }

    history.push({
      timestamp: Date.now(),
      state: structuredClone(state),
      action,
    });

    // Trim history if needed
    if (history.length > historyLimit) {
      history.shift();
    } else {
      historyIndex++;
    }
  }

  /**
   * Schedule persistence
   */
  function schedulePersist(): void {
    if (!options.persist) return;

    if (persistTimeout) {
      clearTimeout(persistTimeout);
    }

    const debounce = options.persist.debounce ?? 100;
    persistTimeout = setTimeout(() => {
      persistState(state, options.persist!);
      persistTimeout = null;
    }, debounce);
  }

  // Create the store proxy
  const store = createProxy(state) as Store<T>;

  // Attach store methods
  (store as any)[STORE_SETTER] = setStore;

  return [store, setStore];
}

// =============================================================================
// Store Utilities
// =============================================================================

/**
 * Get value at dot-notation path
 */
function getValueAtPath(obj: any, path: string): any {
  if (!path) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Load persisted state
 */
function loadPersistedState<T>(config: PersistConfig<T>): T | null {
  try {
    const storage = config.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return null;

    const data = storage.getItem(config.key);
    if (!data) return null;

    const deserialize = config.deserialize ?? JSON.parse;
    return deserialize(data);
  } catch {
    return null;
  }
}

/**
 * Persist state
 */
function persistState<T extends StoreNode>(state: T, config: PersistConfig<T>): void {
  try {
    const storage = config.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return;

    let stateToPersist = state;
    if (config.paths) {
      stateToPersist = {} as T;
      for (const path of config.paths) {
        const value = getValueAtPath(state, path);
        setNestedValue(stateToPersist, path, value);
      }
    }

    const serialize = config.serialize ?? JSON.stringify;
    storage.setItem(config.key, serialize(stateToPersist));
  } catch {
    // Ignore persistence errors
  }
}

/**
 * Set nested value
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Merge persisted state with initial state
 */
function mergeState<T extends StoreNode>(
  initial: T,
  persisted: T,
  paths?: string[]
): T {
  if (!paths) {
    return { ...initial, ...persisted };
  }

  const result = structuredClone(initial);
  for (const path of paths) {
    const value = getValueAtPath(persisted, path);
    if (value !== undefined) {
      setNestedValue(result, path, value);
    }
  }
  return result;
}

// =============================================================================
// Store Helpers
// =============================================================================

/**
 * Create a derived store value (like computed for stores)
 */
export function derive<T extends StoreNode, R>(
  store: Store<T>,
  selector: (state: T) => R
): () => R {
  return () => {
    return selector(store);
  };
}

/**
 * Create a store with actions
 */
export function createStoreWithActions<
  T extends StoreNode,
  A extends Record<string, (set: SetStoreFunction<T>, get: () => T, ...args: any[]) => any>
>(
  initialState: T,
  actions: A,
  options?: StoreOptions<T>
): [Store<T>, SetStoreFunction<T>, { [K in keyof A]: (...args: Parameters<A[K]> extends [any, any, ...infer P] ? P : never) => ReturnType<A[K]> }] {
  const [store, setStore] = createStore(initialState, options);

  const boundActions = {} as any;
  for (const [name, action] of Object.entries(actions)) {
    boundActions[name] = (...args: any[]) => {
      return action(setStore, () => untrack(() => store), ...args);
    };
  }

  return [store, setStore, boundActions];
}

/**
 * Produce immutable updates (Immer-like)
 */
export function produce<T extends StoreNode>(
  state: T,
  recipe: (draft: T) => void
): T {
  const draft = structuredClone(state);
  recipe(draft);
  return draft;
}

/**
 * Reconcile arrays efficiently
 */
export function reconcile<T>(
  oldArray: T[],
  newArray: T[],
  keyFn: (item: T) => string | number
): T[] {
  const oldMap = new Map(oldArray.map((item) => [keyFn(item), item]));

  return newArray.map((newItem) => {
    const key = keyFn(newItem);
    const oldItem = oldMap.get(key);
    if (oldItem && JSON.stringify(oldItem) === JSON.stringify(newItem)) {
      return oldItem; // Reuse old reference if unchanged
    }
    return newItem;
  });
}

/**
 * Create a store slice
 */
export function createSlice<T extends StoreNode, K extends keyof T>(
  store: Store<T>,
  setStore: SetStoreFunction<T>,
  key: K
): [Store<T[K]>, SetStoreFunction<T[K]>] {
  const slice = store[key] as Store<T[K]>;

  const setSlice: SetStoreFunction<T[K]> = (...args: any[]) => {
    (setStore as any)(key, ...args);
  };

  return [slice, setSlice];
}

/**
 * Subscribe to store changes (for side effects)
 */
export function subscribeToStore<T extends StoreNode>(
  store: Store<T>,
  callback: (state: T) => void
): () => void {
  // Access all paths to subscribe
  const traverse = (obj: any): void => {
    if (obj === null || typeof obj !== 'object') return;
    for (const key in obj) {
      const val = obj[key];
      traverse(val);
    }
  };

  // This will trigger signal subscriptions
  traverse(store);

  // Return cleanup function (in real impl, would need effect cleanup)
  return () => {};
}

// =============================================================================
// Undo/Redo for Stores
// =============================================================================

export interface UndoRedoStore<T extends StoreNode> {
  store: Store<T>;
  setStore: SetStoreFunction<T>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

/**
 * Create a store with undo/redo capabilities
 */
export function createUndoableStore<T extends StoreNode>(
  initialState: T,
  options: StoreOptions<T> & { historyLimit?: number } = {}
): UndoRedoStore<T> {
  const history: T[] = [structuredClone(initialState)];
  let index = 0;

  const [store, baseSetStore] = createStore(initialState, {
    ...options,
    middleware: [
      (state) => {
        // Save state to history on change
        if (index < history.length - 1) {
          history.splice(index + 1);
        }
        history.push(structuredClone(state));
        if (history.length > (options.historyLimit ?? 100)) {
          history.shift();
        } else {
          index++;
        }
      },
      ...(options.middleware ?? []),
    ],
  });

  const setStore: SetStoreFunction<T> = baseSetStore;

  const undo = () => {
    if (index > 0) {
      index--;
      Object.assign(store, structuredClone(history[index]));
    }
  };

  const redo = () => {
    if (index < history.length - 1) {
      index++;
      Object.assign(store, structuredClone(history[index]));
    }
  };

  const canUndo = () => index > 0;
  const canRedo = () => index < history.length - 1;
  const clear = () => {
    history.splice(1);
    index = 0;
  };

  return { store, setStore, undo, redo, canUndo, canRedo, clear };
}
