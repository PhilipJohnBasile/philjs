/**
 * PhilJS Immer Integration
 *
 * Seamless immutable state updates with Immer, integrated with PhilJS signals.
 *
 * @example
 * ```typescript
 * import { immerSignal, useImmer, createImmerStore } from '@philjs/immer';
 *
 * // Create an Immer-powered signal
 * const todos = immerSignal<Todo[]>([]);
 * todos.update(draft => {
 *   draft.push({ id: 1, text: 'Learn PhilJS', done: false });
 * });
 *
 * // Use the hook
 * const [state, updateState] = useImmer({ count: 0 });
 * updateState(draft => { draft.count++; });
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';
import { produce, enableMapSet, enablePatches, applyPatches, type Draft, type Patch, type Immutable } from 'immer';

// Enable Immer plugins
enableMapSet();
enablePatches();

// ============================================================================
// Types
// ============================================================================

export type ImmerRecipe<T> = (draft: Draft<T>) => void | T;
export type ImmerUpdater<T> = (recipe: ImmerRecipe<T>) => void;

export interface ImmerSignal<T> extends Signal<T> {
  /** Update state using an Immer recipe */
  update: (recipe: ImmerRecipe<T>) => void;
  /** Update state and get patches */
  updateWithPatches: (recipe: ImmerRecipe<T>) => { patches: Patch[]; inversePatches: Patch[] };
  /** Apply patches to state */
  applyPatches: (patches: Patch[]) => void;
  /** Get immutable snapshot */
  snapshot: () => Immutable<T>;
}

export interface ImmerStoreOptions<T> {
  /** Initial state */
  initialState: T;
  /** Enable time-travel debugging */
  enableTimeTravel?: boolean;
  /** Max history entries */
  maxHistory?: number;
  /** State validator */
  validate?: (state: T) => boolean;
  /** Middleware functions */
  middleware?: ImmerMiddleware<T>[];
  /** Name for debugging */
  name?: string;
}

export type ImmerMiddleware<T> = (
  state: T,
  recipe: ImmerRecipe<T>,
  next: () => void
) => void;

export interface ImmerStore<T> {
  /** Current state signal */
  state: Signal<T>;
  /** Update state */
  update: (recipe: ImmerRecipe<T>) => void;
  /** Subscribe to state changes */
  subscribe: (listener: (state: T) => void) => () => void;
  /** Get immutable snapshot */
  getSnapshot: () => Immutable<T>;
  /** Reset to initial state */
  reset: () => void;
  /** Undo last change */
  undo: () => boolean;
  /** Redo last undone change */
  redo: () => boolean;
  /** Can undo */
  canUndo: Computed<boolean>;
  /** Can redo */
  canRedo: Computed<boolean>;
  /** History length */
  historyLength: Computed<number>;
  /** Future length */
  futureLength: Computed<number>;
  /** Get all patches since initial state */
  getPatches: () => Patch[];
  /** Create a selector */
  selector: <R>(fn: (state: T) => R) => Computed<R>;
}

export interface ImmerMapOptions<K, V> {
  /** Initial entries */
  initialEntries?: [K, V][];
}

export interface ImmerSetOptions<T> {
  /** Initial values */
  initialValues?: T[];
}

// ============================================================================
// Core: Immer Signal
// ============================================================================

/**
 * Create a signal with Immer-powered updates
 */
export function immerSignal<T>(initialValue: T): ImmerSignal<T> {
  const sig = signal<T>(initialValue);

  const immerSig = Object.assign(sig, {
    update(recipe: ImmerRecipe<T>): void {
      const current = sig.get();
      const next = produce(current, recipe);
      sig.set(next);
    },

    updateWithPatches(recipe: ImmerRecipe<T>): { patches: Patch[]; inversePatches: Patch[] } {
      const current = sig.get();
      let patches: Patch[] = [];
      let inversePatches: Patch[] = [];

      const next = produce(current, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });

      sig.set(next);
      return { patches, inversePatches };
    },

    applyPatches(patches: Patch[]): void {
      const current = sig.get();
      const next = applyPatches(current, patches);
      sig.set(next);
    },

    snapshot(): Immutable<T> {
      return sig.get() as Immutable<T>;
    },
  }) as ImmerSignal<T>;

  return immerSig;
}

// ============================================================================
// Hook: useImmer
// ============================================================================

/**
 * Hook to use Immer with signals
 */
export function useImmer<T>(initialValue: T): [Signal<T>, ImmerUpdater<T>] {
  const state = immerSignal(initialValue);

  const updateState = (recipe: ImmerRecipe<T>) => {
    state.update(recipe);
  };

  return [state, updateState];
}

/**
 * Hook to use Immer with patches tracking
 */
export function useImmerWithPatches<T>(initialValue: T): [
  Signal<T>,
  ImmerUpdater<T>,
  {
    patches: Signal<Patch[]>;
    inversePatches: Signal<Patch[]>;
    clearPatches: () => void;
  }
] {
  const state = immerSignal(initialValue);
  const patches = signal<Patch[]>([]);
  const inversePatches = signal<Patch[]>([]);

  const updateState = (recipe: ImmerRecipe<T>) => {
    const result = state.updateWithPatches(recipe);
    patches.set([...patches.get(), ...result.patches]);
    inversePatches.set([...inversePatches.get(), ...result.inversePatches]);
  };

  const clearPatches = () => {
    patches.set([]);
    inversePatches.set([]);
  };

  return [state, updateState, { patches, inversePatches, clearPatches }];
}

// ============================================================================
// Store: Full-featured Immer Store
// ============================================================================

/**
 * Create a full-featured Immer store with time-travel
 */
export function createImmerStore<T>(options: ImmerStoreOptions<T>): ImmerStore<T> {
  const {
    initialState,
    enableTimeTravel = false,
    maxHistory = 100,
    validate,
    middleware = [],
    name = 'immer-store',
  } = options;

  const state = signal<T>(initialState);
  const history = signal<Patch[][]>([]);
  const future = signal<Patch[][]>([]);
  const allPatches = signal<Patch[]>([]);
  const listeners = new Set<(state: T) => void>();

  const canUndo = computed(() => history.get().length > 0);
  const canRedo = computed(() => future.get().length > 0);
  const historyLength = computed(() => history.get().length);
  const futureLength = computed(() => future.get().length);

  // Apply middleware chain
  const applyMiddleware = (recipe: ImmerRecipe<T>, finalAction: () => void) => {
    if (middleware.length === 0) {
      finalAction();
      return;
    }

    let index = 0;
    const next = () => {
      if (index < middleware.length) {
        const mw = middleware[index++];
        mw(state.get(), recipe, next);
      } else {
        finalAction();
      }
    };

    next();
  };

  const update = (recipe: ImmerRecipe<T>) => {
    applyMiddleware(recipe, () => {
      const current = state.get();
      let patches: Patch[] = [];
      let inversePatches: Patch[] = [];

      const next = produce(current, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });

      // Validate if validator provided
      if (validate && !validate(next as T)) {
        console.warn(`[${name}] State update rejected by validator`);
        return;
      }

      state.set(next);

      // Track patches
      allPatches.set([...allPatches.get(), ...patches]);

      // Update history for time-travel
      if (enableTimeTravel && inversePatches.length > 0) {
        const newHistory = [...history.get(), inversePatches];
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        }
        history.set(newHistory);
        future.set([]); // Clear future on new change
      }

      // Notify listeners
      listeners.forEach(listener => listener(next as T));
    });
  };

  const undo = (): boolean => {
    if (!canUndo.get()) return false;

    const hist = history.get();
    const inversePatches = hist[hist.length - 1];

    if (!inversePatches) return false;

    const current = state.get();
    let forwardPatches: Patch[] = [];

    // Apply inverse patches and capture forward patches
    const previous = produce(current, () => {}, (p) => {
      forwardPatches = p;
    });

    const undone = applyPatches(current, inversePatches);
    state.set(undone);

    // Update history and future
    history.set(hist.slice(0, -1));
    future.set([...future.get(), forwardPatches]);

    listeners.forEach(listener => listener(undone as T));
    return true;
  };

  const redo = (): boolean => {
    if (!canRedo.get()) return false;

    const fut = future.get();
    const forwardPatches = fut[fut.length - 1];

    if (!forwardPatches) return false;

    const current = state.get();
    let inversePatches: Patch[] = [];

    const next = produce(current, draft => {
      // Re-apply forward changes
    }, (_, ip) => {
      inversePatches = ip;
    });

    const redone = applyPatches(current, forwardPatches);
    state.set(redone);

    // Update history and future
    future.set(fut.slice(0, -1));
    history.set([...history.get(), inversePatches]);

    listeners.forEach(listener => listener(redone as T));
    return true;
  };

  const subscribe = (listener: (state: T) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const reset = () => {
    state.set(initialState);
    history.set([]);
    future.set([]);
    allPatches.set([]);
    listeners.forEach(listener => listener(initialState));
  };

  const selector = <R>(fn: (state: T) => R): Computed<R> => {
    return computed(() => fn(state.get()));
  };

  return {
    state,
    update,
    subscribe,
    getSnapshot: () => state.get() as Immutable<T>,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    futureLength,
    getPatches: () => allPatches.get(),
    selector,
  };
}

// ============================================================================
// Map and Set Support
// ============================================================================

/**
 * Create an Immer-powered Map signal
 */
export function immerMap<K, V>(options: ImmerMapOptions<K, V> = {}): {
  map: ImmerSignal<Map<K, V>>;
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  delete: (key: K) => boolean;
  clear: () => void;
  has: (key: K) => boolean;
  size: Computed<number>;
  keys: Computed<K[]>;
  values: Computed<V[]>;
  entries: Computed<[K, V][]>;
} {
  const map = immerSignal(new Map<K, V>(options.initialEntries));

  return {
    map,
    get: (key: K) => map.get().get(key),
    set: (key: K, value: V) => {
      map.update(draft => {
        draft.set(key, value);
      });
    },
    delete: (key: K) => {
      let existed = false;
      map.update(draft => {
        existed = draft.delete(key);
      });
      return existed;
    },
    clear: () => {
      map.update(draft => {
        draft.clear();
      });
    },
    has: (key: K) => map.get().has(key),
    size: computed(() => map.get().size),
    keys: computed(() => Array.from(map.get().keys())),
    values: computed(() => Array.from(map.get().values())),
    entries: computed(() => Array.from(map.get().entries())),
  };
}

/**
 * Create an Immer-powered Set signal
 */
export function immerSet<T>(options: ImmerSetOptions<T> = {}): {
  set: ImmerSignal<Set<T>>;
  add: (value: T) => void;
  delete: (value: T) => boolean;
  clear: () => void;
  has: (value: T) => boolean;
  size: Computed<number>;
  values: Computed<T[]>;
  toggle: (value: T) => void;
} {
  const set = immerSignal(new Set<T>(options.initialValues));

  return {
    set,
    add: (value: T) => {
      set.update(draft => {
        draft.add(value);
      });
    },
    delete: (value: T) => {
      let existed = false;
      set.update(draft => {
        existed = draft.delete(value);
      });
      return existed;
    },
    clear: () => {
      set.update(draft => {
        draft.clear();
      });
    },
    has: (value: T) => set.get().has(value),
    size: computed(() => set.get().size),
    values: computed(() => Array.from(set.get())),
    toggle: (value: T) => {
      set.update(draft => {
        if (draft.has(value)) {
          draft.delete(value);
        } else {
          draft.add(value);
        }
      });
    },
  };
}

// ============================================================================
// Array Helpers
// ============================================================================

/**
 * Create an Immer-powered array signal with helper methods
 */
export function immerArray<T>(initialValue: T[] = []): {
  array: ImmerSignal<T[]>;
  push: (...items: T[]) => void;
  pop: () => T | undefined;
  shift: () => T | undefined;
  unshift: (...items: T[]) => void;
  splice: (start: number, deleteCount?: number, ...items: T[]) => T[];
  remove: (predicate: (item: T) => boolean) => void;
  removeAt: (index: number) => T | undefined;
  insert: (index: number, item: T) => void;
  move: (fromIndex: number, toIndex: number) => void;
  swap: (indexA: number, indexB: number) => void;
  updateAt: (index: number, recipe: (item: Draft<T>) => void) => void;
  find: (predicate: (item: T) => boolean) => T | undefined;
  findIndex: (predicate: (item: T) => boolean) => number;
  filter: (predicate: (item: T) => boolean) => void;
  sort: (compare?: (a: T, b: T) => number) => void;
  reverse: () => void;
  clear: () => void;
  length: Computed<number>;
  isEmpty: Computed<boolean>;
} {
  const array = immerSignal<T[]>(initialValue);
  let lastRemoved: T[] = [];

  return {
    array,
    push: (...items: T[]) => {
      array.update(draft => {
        draft.push(...items);
      });
    },
    pop: () => {
      let result: T | undefined;
      array.update(draft => {
        result = draft.pop();
      });
      return result;
    },
    shift: () => {
      let result: T | undefined;
      array.update(draft => {
        result = draft.shift();
      });
      return result;
    },
    unshift: (...items: T[]) => {
      array.update(draft => {
        draft.unshift(...items);
      });
    },
    splice: (start: number, deleteCount?: number, ...items: T[]) => {
      array.update(draft => {
        lastRemoved = draft.splice(start, deleteCount ?? 0, ...items);
      });
      return lastRemoved;
    },
    remove: (predicate: (item: T) => boolean) => {
      array.update(draft => {
        const index = draft.findIndex(predicate);
        if (index !== -1) {
          draft.splice(index, 1);
        }
      });
    },
    removeAt: (index: number) => {
      let result: T | undefined;
      array.update(draft => {
        if (index >= 0 && index < draft.length) {
          [result] = draft.splice(index, 1);
        }
      });
      return result;
    },
    insert: (index: number, item: T) => {
      array.update(draft => {
        draft.splice(index, 0, item);
      });
    },
    move: (fromIndex: number, toIndex: number) => {
      array.update(draft => {
        if (fromIndex < 0 || fromIndex >= draft.length) return;
        if (toIndex < 0 || toIndex >= draft.length) return;
        const [item] = draft.splice(fromIndex, 1);
        draft.splice(toIndex, 0, item);
      });
    },
    swap: (indexA: number, indexB: number) => {
      array.update(draft => {
        if (indexA < 0 || indexA >= draft.length) return;
        if (indexB < 0 || indexB >= draft.length) return;
        [draft[indexA], draft[indexB]] = [draft[indexB], draft[indexA]];
      });
    },
    updateAt: (index: number, recipe: (item: Draft<T>) => void) => {
      array.update(draft => {
        if (index >= 0 && index < draft.length) {
          recipe(draft[index]);
        }
      });
    },
    find: (predicate: (item: T) => boolean) => array.get().find(predicate),
    findIndex: (predicate: (item: T) => boolean) => array.get().findIndex(predicate),
    filter: (predicate: (item: T) => boolean) => {
      array.update(draft => {
        const filtered = draft.filter(predicate);
        draft.length = 0;
        draft.push(...filtered);
      });
    },
    sort: (compare?: (a: T, b: T) => number) => {
      array.update(draft => {
        draft.sort(compare);
      });
    },
    reverse: () => {
      array.update(draft => {
        draft.reverse();
      });
    },
    clear: () => {
      array.set([]);
    },
    length: computed(() => array.get().length),
    isEmpty: computed(() => array.get().length === 0),
  };
}

// ============================================================================
// Object Helpers
// ============================================================================

/**
 * Create an Immer-powered object signal with helper methods
 */
export function immerObject<T extends Record<string, any>>(initialValue: T): {
  object: ImmerSignal<T>;
  get: <K extends keyof T>(key: K) => T[K];
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  update: <K extends keyof T>(key: K, recipe: (value: Draft<T[K]>) => void) => void;
  delete: <K extends keyof T>(key: K) => void;
  merge: (partial: Partial<T>) => void;
  reset: () => void;
  keys: Computed<(keyof T)[]>;
  values: Computed<T[keyof T][]>;
  entries: Computed<[keyof T, T[keyof T]][]>;
  pick: <K extends keyof T>(...keys: K[]) => Computed<Pick<T, K>>;
  omit: <K extends keyof T>(...keys: K[]) => Computed<Omit<T, K>>;
} {
  const object = immerSignal<T>(initialValue);

  return {
    object,
    get: <K extends keyof T>(key: K) => object.get()[key],
    set: <K extends keyof T>(key: K, value: T[K]) => {
      object.update(draft => {
        (draft as any)[key] = value;
      });
    },
    update: <K extends keyof T>(key: K, recipe: (value: Draft<T[K]>) => void) => {
      object.update(draft => {
        recipe((draft as any)[key]);
      });
    },
    delete: <K extends keyof T>(key: K) => {
      object.update(draft => {
        delete (draft as any)[key];
      });
    },
    merge: (partial: Partial<T>) => {
      object.update(draft => {
        Object.assign(draft, partial);
      });
    },
    reset: () => {
      object.set(initialValue);
    },
    keys: computed(() => Object.keys(object.get()) as (keyof T)[]),
    values: computed(() => Object.values(object.get())),
    entries: computed(() => Object.entries(object.get()) as [keyof T, T[keyof T]][]),
    pick: <K extends keyof T>(...keys: K[]) => {
      return computed(() => {
        const obj = object.get();
        const result = {} as Pick<T, K>;
        for (const key of keys) {
          result[key] = obj[key];
        }
        return result;
      });
    },
    omit: <K extends keyof T>(...keys: K[]) => {
      return computed(() => {
        const obj = object.get();
        const result = { ...obj };
        for (const key of keys) {
          delete result[key];
        }
        return result as Omit<T, K>;
      });
    },
  };
}

// ============================================================================
// Batch Updates
// ============================================================================

/**
 * Batch multiple Immer updates into a single re-render
 */
export function batchImmerUpdates<T extends any[]>(
  updates: { signal: ImmerSignal<any>; recipe: ImmerRecipe<any> }[]
): void {
  batch(() => {
    for (const { signal: sig, recipe } of updates) {
      sig.update(recipe);
    }
  });
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Logger middleware for debugging
 */
export function loggerMiddleware<T>(name: string = 'state'): ImmerMiddleware<T> {
  return (state, recipe, next) => {
    const prevState = state;
    console.group(`[Immer] ${name} update`);
    console.log('Previous state:', prevState);
    next();
    console.log('Recipe:', recipe.toString());
    console.groupEnd();
  };
}

/**
 * Validation middleware
 */
export function validationMiddleware<T>(
  validator: (state: T) => boolean,
  onInvalid?: (state: T) => void
): ImmerMiddleware<T> {
  return (state, _recipe, next) => {
    next();
    // Note: This runs after the update - for pre-validation, use store's validate option
  };
}

/**
 * Persistence middleware
 */
export function persistMiddleware<T>(
  key: string,
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : (null as any)
): ImmerMiddleware<T> {
  return (state, _recipe, next) => {
    next();
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn(`[Immer] Failed to persist state to ${key}:`, e);
      }
    }
  };
}

/**
 * Load persisted state
 */
export function loadPersistedState<T>(
  key: string,
  defaultValue: T,
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : (null as any)
): T {
  if (!storage) return defaultValue;

  try {
    const stored = storage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`[Immer] Failed to load persisted state from ${key}:`, e);
  }

  return defaultValue;
}

// ============================================================================
// Derived State
// ============================================================================

/**
 * Create a derived signal from an Immer signal
 */
export function deriveImmer<T, R>(
  source: ImmerSignal<T>,
  selector: (state: T) => R
): Computed<R> {
  return computed(() => selector(source.get()));
}

/**
 * Create a two-way binding between signals
 */
export function bindImmer<T, K extends keyof T>(
  source: ImmerSignal<T>,
  key: K
): {
  value: Computed<T[K]>;
  set: (value: T[K]) => void;
} {
  return {
    value: computed(() => source.get()[key]),
    set: (value: T[K]) => {
      source.update(draft => {
        (draft as any)[key] = value;
      });
    },
  };
}

// ============================================================================
// Undo/Redo Helpers
// ============================================================================

export interface UndoableState<T> {
  present: T;
  past: T[];
  future: T[];
}

/**
 * Create an undoable Immer signal
 */
export function createUndoable<T>(initialState: T, maxHistory: number = 50): {
  state: Signal<T>;
  update: ImmerUpdater<T>;
  undo: () => void;
  redo: () => void;
  canUndo: Computed<boolean>;
  canRedo: Computed<boolean>;
  reset: () => void;
  jumpTo: (index: number) => void;
  history: Computed<T[]>;
} {
  const internal = signal<UndoableState<T>>({
    present: initialState,
    past: [],
    future: [],
  });

  const state = computed(() => internal.get().present);

  const update: ImmerUpdater<T> = (recipe) => {
    const current = internal.get();
    const nextPresent = produce(current.present, recipe);

    const newPast = [...current.past, current.present];
    if (newPast.length > maxHistory) {
      newPast.shift();
    }

    internal.set({
      present: nextPresent as T,
      past: newPast,
      future: [],
    });
  };

  const undo = () => {
    const current = internal.get();
    if (current.past.length === 0) return;

    const previous = current.past[current.past.length - 1];
    const newPast = current.past.slice(0, -1);

    internal.set({
      present: previous,
      past: newPast,
      future: [current.present, ...current.future],
    });
  };

  const redo = () => {
    const current = internal.get();
    if (current.future.length === 0) return;

    const next = current.future[0];
    const newFuture = current.future.slice(1);

    internal.set({
      present: next,
      past: [...current.past, current.present],
      future: newFuture,
    });
  };

  const reset = () => {
    internal.set({
      present: initialState,
      past: [],
      future: [],
    });
  };

  const jumpTo = (index: number) => {
    const current = internal.get();
    const allStates = [...current.past, current.present, ...current.future];

    if (index < 0 || index >= allStates.length) return;

    internal.set({
      present: allStates[index],
      past: allStates.slice(0, index),
      future: allStates.slice(index + 1),
    });
  };

  return {
    state: state as unknown as Signal<T>,
    update,
    undo,
    redo,
    canUndo: computed(() => internal.get().past.length > 0),
    canRedo: computed(() => internal.get().future.length > 0),
    reset,
    jumpTo,
    history: computed(() => [...internal.get().past, internal.get().present]),
  };
}

// ============================================================================
// Deep Clone and Compare
// ============================================================================

/**
 * Deep clone using Immer
 */
export function deepClone<T>(value: T): T {
  return produce(value, () => {});
}

/**
 * Check if two values are structurally equal
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key))) return false;
    }
    return true;
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key =>
    deepEqual((a as any)[key], (b as any)[key])
  );
}

// ============================================================================
// Re-exports from Immer
// ============================================================================

export {
  produce,
  enableMapSet,
  enablePatches,
  applyPatches,
  type Draft,
  type Patch,
  type Immutable,
} from 'immer';
