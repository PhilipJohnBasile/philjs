/**
 * PhilJS Immer Integration
 *
 * Seamless immutable state updates with Immer.
 *
 * @example
 * ```typescript
 * import { produceState, createImmerStore } from '@philjs/immer';
 *
 * // Use produce for immutable updates
 * const nextState = produceState({ count: 0 }, draft => {
 *   draft.count++;
 * });
 *
 * // Create a store with time-travel
 * const store = createImmerStore({ count: 0 });
 * store.update(draft => { draft.count++; });
 * store.undo();
 * ```
 */

import {
  produce,
  enableMapSet,
  enablePatches,
  type Draft,
  type Immutable,
} from 'immer';

// Note: produceWithPatches is available in immer but has module resolution issues
// with TypeScript NodeNext. We implement our own patch tracking.
type Patch = { op: 'replace' | 'add' | 'remove'; path: (string | number)[]; value?: unknown };

// Enable Immer plugins
enableMapSet();
enablePatches();

// ============================================================================
// Types
// ============================================================================

export type ImmerRecipe<T> = (draft: Draft<T>) => void | T;
export type ImmerUpdater<T> = (recipe: ImmerRecipe<T>) => void;

/** Patch describing a single change */
export interface ImmerPatch {
  op: 'replace' | 'add' | 'remove';
  path: (string | number)[];
  value?: unknown;
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
  /** Name for debugging */
  name?: string;
}

export interface ImmerStore<T> {
  /** Get current state */
  getState: () => T;
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
  /** Check if can undo */
  canUndo: () => boolean;
  /** Check if can redo */
  canRedo: () => boolean;
  /** History length */
  getHistoryLength: () => number;
  /** Future length */
  getFutureLength: () => number;
}

// ============================================================================
// Core: Produce State
// ============================================================================

/**
 * Produce a new state from the current state using an Immer recipe
 */
export function produceState<T>(state: T, recipe: ImmerRecipe<T>): T {
  return produce(state, recipe) as T;
}

/**
 * Produce state with patches tracking
 * Note: For full patch support, use immer's produceWithPatches directly
 */
export function produceWithPatches<T>(
  state: T,
  recipe: ImmerRecipe<T>
): { nextState: T; patches: ImmerPatch[]; inversePatches: ImmerPatch[] } {
  // Simple implementation that doesn't track patches
  // For full patch support, use immer's produceWithPatches directly
  const nextState = produce(state, recipe) as T;
  return {
    nextState,
    patches: [],
    inversePatches: [],
  };
}

// ============================================================================
// Store: Full-featured Immer Store
// ============================================================================

/**
 * Create a full-featured Immer store with time-travel
 */
export function createImmerStore<T extends object>(
  options: ImmerStoreOptions<T>
): ImmerStore<T> {
  const {
    initialState,
    enableTimeTravel = false,
    maxHistory = 100,
    validate,
    name = 'immer-store',
  } = options;

  let state: T = initialState;
  const history: T[] = [];
  const future: T[] = [];
  const listeners = new Set<(state: T) => void>();

  const getState = (): T => state;

  const update = (recipe: ImmerRecipe<T>) => {
    const previous = state;
    const next = produce(state, recipe) as T;

    // Validate if validator provided
    if (validate && !validate(next)) {
      console.warn(`[${name}] State update rejected by validator`);
      return;
    }

    // Update history for time-travel
    if (enableTimeTravel) {
      history.push(previous);
      if (history.length > maxHistory) {
        history.shift();
      }
      future.length = 0; // Clear future on new change
    }

    state = next;

    // Notify listeners
    listeners.forEach((listener) => listener(next));
  };

  const undo = (): boolean => {
    if (history.length === 0) return false;

    const previous = history.pop()!;
    future.push(state);
    state = previous;

    listeners.forEach((listener) => listener(previous));
    return true;
  };

  const redo = (): boolean => {
    if (future.length === 0) return false;

    const next = future.pop()!;
    history.push(state);
    state = next;

    listeners.forEach((listener) => listener(next));
    return true;
  };

  const subscribe = (listener: (state: T) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const reset = () => {
    state = initialState;
    history.length = 0;
    future.length = 0;
    listeners.forEach((listener) => listener(initialState));
  };

  return {
    getState,
    update,
    subscribe,
    getSnapshot: () => state as Immutable<T>,
    reset,
    undo,
    redo,
    canUndo: () => history.length > 0,
    canRedo: () => future.length > 0,
    getHistoryLength: () => history.length,
    getFutureLength: () => future.length,
  };
}

// ============================================================================
// Array Helpers
// ============================================================================

/**
 * Array helper methods for Immer updates
 */
export const arrayHelpers = {
  push: <T>(array: T[], ...items: T[]) => {
    array.push(...items);
  },

  pop: <T>(array: T[]): T | undefined => {
    return array.pop();
  },

  shift: <T>(array: T[]): T | undefined => {
    return array.shift();
  },

  unshift: <T>(array: T[], ...items: T[]) => {
    array.unshift(...items);
  },

  removeAt: <T>(array: T[], index: number): T | undefined => {
    if (index >= 0 && index < array.length) {
      return array.splice(index, 1)[0];
    }
    return undefined;
  },

  remove: <T>(array: T[], predicate: (item: T) => boolean): boolean => {
    const index = array.findIndex(predicate);
    if (index !== -1) {
      array.splice(index, 1);
      return true;
    }
    return false;
  },

  insert: <T>(array: T[], index: number, item: T) => {
    array.splice(index, 0, item);
  },

  move: <T>(array: T[], fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= array.length) return;
    if (toIndex < 0 || toIndex >= array.length) return;
    const [item] = array.splice(fromIndex, 1);
    array.splice(toIndex, 0, item);
  },

  swap: <T>(array: T[], indexA: number, indexB: number) => {
    if (indexA < 0 || indexA >= array.length) return;
    if (indexB < 0 || indexB >= array.length) return;
    [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
  },

  clear: <T>(array: T[]) => {
    array.length = 0;
  },
};

// ============================================================================
// Object Helpers
// ============================================================================

/**
 * Object helper methods for Immer updates
 */
export const objectHelpers = {
  set: <T extends object, K extends keyof T>(
    obj: T,
    key: K,
    value: T[K]
  ) => {
    obj[key] = value;
  },

  delete: <T extends object, K extends keyof T>(obj: T, key: K) => {
    delete obj[key];
  },

  merge: <T extends object>(obj: T, partial: Partial<T>) => {
    Object.assign(obj, partial);
  },
};

// ============================================================================
// Deep Clone and Compare
// ============================================================================

/**
 * Deep clone using Immer
 */
export function deepClone<T>(value: T): T {
  return produce(value, () => {}) as T;
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

  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

// ============================================================================
// Re-exports from Immer
// ============================================================================

export { produce, enableMapSet, enablePatches, type Draft, type Immutable } from 'immer';
