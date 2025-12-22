/**
 * Jotai-style atomic state management for PhilJS
 *
 * Features:
 * - Primitive atoms (read/write state)
 * - Derived atoms (computed from other atoms)
 * - Async atoms (promises)
 * - Atom families (parameterized atoms)
 * - Write-only atoms (actions)
 * - Atom utilities (reset, freeze, etc.)
 */

import { signal, memo, resource, batch, type Signal, type Memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export type Getter = <Value>(atom: Atom<Value>) => Value;
export type Setter = <Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>,
  ...args: Args
) => Result;

export interface Atom<Value> {
  read: (get: Getter) => Value;
  debugLabel?: string;
}

export interface WritableAtom<Value, Args extends unknown[], Result> extends Atom<Value> {
  write: (get: Getter, set: Setter, ...args: Args) => Result;
}

export type SetStateAction<Value> = Value | ((prev: Value) => Value);

export type PrimitiveAtom<Value> = WritableAtom<Value, [SetStateAction<Value>], void>;

export interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType;
  remove: (param: Param) => void;
}

// ============================================================================
// Store
// ============================================================================

interface AtomState<Value> {
  signal: Signal<Value>;
  dependencies: Set<Atom<any>>;
}

class Store {
  private atomStates = new WeakMap<Atom<any>, AtomState<any>>();
  private dependencyMap = new WeakMap<Atom<any>, Set<Atom<any>>>();

  public get<Value>(atom: Atom<Value>): Value {
    const atomState = this.getAtomState(atom);
    return atomState.signal();
  }

  public set<Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    ...args: Args
  ): Result {
    if (!('write' in atom)) {
      throw new Error('Atom is not writable');
    }

    return atom.write(
      (a) => this.get(a),
      (a, ...args) => this.set(a as any, ...args),
      ...args
    );
  }

  public subscribe<Value>(atom: Atom<Value>, callback: (value: Value) => void): () => void {
    const atomState = this.getAtomState(atom);
    return atomState.signal.subscribe(callback);
  }

  private getAtomState<Value>(atom: Atom<Value>): AtomState<Value> {
    let atomState = this.atomStates.get(atom);

    if (!atomState) {
      // Create initial state
      const dependencies = new Set<Atom<any>>();

      const getter: Getter = <V>(a: Atom<V>): V => {
        dependencies.add(a);
        return this.get(a);
      };

      const value = atom.read(getter);
      const sig = signal<Value>(value);

      atomState = {
        signal: sig,
        dependencies,
      };

      this.atomStates.set(atom, atomState);

      // Track reverse dependencies for invalidation
      for (const dep of dependencies) {
        let dependents = this.dependencyMap.get(dep);
        if (!dependents) {
          dependents = new Set();
          this.dependencyMap.set(dep, dependents);
        }
        dependents.add(atom);
      }
    }

    return atomState;
  }

  public invalidate<Value>(atom: Atom<Value>): void {
    const atomState = this.atomStates.get(atom);
    if (!atomState) return;

    // Re-compute value
    const getter: Getter = <V>(a: Atom<V>): V => this.get(a);
    const newValue = atom.read(getter);
    atomState.signal.set(newValue);

    // Invalidate dependents
    const dependents = this.dependencyMap.get(atom);
    if (dependents) {
      for (const dependent of dependents) {
        this.invalidate(dependent);
      }
    }
  }
}

const defaultStore = new Store();

// ============================================================================
// Core Atom Creation
// ============================================================================

/**
 * Create a primitive atom (read/write state)
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 *
 * // In component
 * const count = useAtom(countAtom);
 * const setCount = useSetAtom(countAtom);
 * setCount(5);
 * setCount(c => c + 1);
 * ```
 */
export function atom<Value>(initialValue: Value): PrimitiveAtom<Value>;

/**
 * Create a derived atom (computed from other atoms)
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 * const doubledAtom = atom((get) => get(countAtom) * 2);
 * ```
 */
export function atom<Value>(read: (get: Getter) => Value): Atom<Value>;

/**
 * Create a writable derived atom
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 * const incrementAtom = atom(
 *   (get) => get(countAtom),
 *   (get, set) => set(countAtom, get(countAtom) + 1)
 * );
 * ```
 */
export function atom<Value, Args extends unknown[], Result>(
  read: (get: Getter) => Value,
  write: (get: Getter, set: Setter, ...args: Args) => Result
): WritableAtom<Value, Args, Result>;

export function atom<Value, Args extends unknown[], Result>(
  read: Value | ((get: Getter) => Value),
  write?: (get: Getter, set: Setter, ...args: Args) => Result
): Atom<Value> | WritableAtom<Value, Args, Result> | PrimitiveAtom<Value> {
  if (typeof read === 'function') {
    // Derived atom
    const readFn = read as (get: Getter) => Value;

    if (write) {
      // Writable derived atom
      return {
        read: readFn,
        write,
      };
    }

    // Read-only derived atom
    return {
      read: readFn,
    };
  } else {
    // Primitive atom
    const initialValue = read;
    const valueSignal = signal<Value>(initialValue);

    const primitiveAtom: PrimitiveAtom<Value> = {
      read: () => valueSignal(),
      write: (get, set, arg) => {
        const nextValue =
          typeof arg === 'function' ? (arg as (prev: Value) => Value)(valueSignal()) : arg;
        valueSignal.set(nextValue);

        // Invalidate dependents
        defaultStore.invalidate(primitiveAtom);
      },
    };

    return primitiveAtom;
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Read atom value
 *
 * @example
 * ```ts
 * const count = useAtomValue(countAtom);
 * ```
 */
export function useAtomValue<Value>(atomInstance: Atom<Value>): Value {
  return defaultStore.get(atomInstance);
}

/**
 * Get setter function for atom
 *
 * @example
 * ```ts
 * const setCount = useSetAtom(countAtom);
 * setCount(5);
 * ```
 */
export function useSetAtom<Value, Args extends unknown[], Result>(
  atomInstance: WritableAtom<Value, Args, Result>
): (...args: Args) => Result {
  return (...args: Args) => defaultStore.set(atomInstance, ...args);
}

/**
 * Read and write atom
 *
 * @example
 * ```ts
 * const [count, setCount] = useAtom(countAtom);
 * ```
 */
export function useAtom<Value, Args extends unknown[], Result>(
  atomInstance: WritableAtom<Value, Args, Result>
): [Value, (...args: Args) => Result] {
  const value = useAtomValue(atomInstance);
  const setter = useSetAtom(atomInstance);
  return [value, setter];
}

// ============================================================================
// Async Atoms
// ============================================================================

export interface AsyncAtom<Value> extends Atom<Value> {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

/**
 * Create an async atom that fetches data
 *
 * @example
 * ```ts
 * const userAtom = asyncAtom(async (get) => {
 *   const userId = get(userIdAtom);
 *   const response = await fetch(`/api/users/${userId}`);
 *   return response.json();
 * });
 *
 * // In component
 * const user = useAtomValue(userAtom);
 * if (userAtom.loading()) return <Spinner />;
 * if (userAtom.error()) return <Error />;
 * return <div>{user.name}</div>;
 * ```
 */
export function asyncAtom<Value>(
  read: (get: Getter) => Promise<Value>
): AsyncAtom<Value> {
  const loading = signal(true);
  const error = signal<Error | null>(null);
  const data = signal<Value | undefined>(undefined);

  const asyncAtomInstance: AsyncAtom<Value> = {
    read: (get) => {
      const promise = read(get);

      promise
        .then((value) => {
          data.set(value);
          loading.set(false);
          error.set(null);
        })
        .catch((err) => {
          error.set(err instanceof Error ? err : new Error(String(err)));
          loading.set(false);
        });

      if (error()) throw error();
      return data() as Value;
    },
    loading,
    error,
  };

  return asyncAtomInstance;
}

/**
 * Create a loadable async atom (doesn't throw)
 *
 * @example
 * ```ts
 * const userAtom = loadable(async (get) => {
 *   const response = await fetch('/api/user');
 *   return response.json();
 * });
 *
 * const loadableUser = useAtomValue(userAtom);
 * if (loadableUser.state === 'loading') return <Spinner />;
 * if (loadableUser.state === 'hasError') return <Error error={loadableUser.error} />;
 * return <div>{loadableUser.data.name}</div>;
 * ```
 */
export function loadable<Value>(
  asyncAtomInstance: Atom<Value>
): Atom<
  | { state: 'loading' }
  | { state: 'hasData'; data: Value }
  | { state: 'hasError'; error: Error }
> {
  return atom((get) => {
    try {
      const value = get(asyncAtomInstance);
      return { state: 'hasData' as const, data: value };
    } catch (error) {
      if (error instanceof Promise) {
        return { state: 'loading' as const };
      }
      return {
        state: 'hasError' as const,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });
}

// ============================================================================
// Atom Families
// ============================================================================

/**
 * Create a family of atoms parameterized by a value
 *
 * @example
 * ```ts
 * const todoAtomFamily = atomFamily((id: number) =>
 *   atom({ id, text: '', completed: false })
 * );
 *
 * // Use with different IDs
 * const todo1 = useAtomValue(todoAtomFamily(1));
 * const todo2 = useAtomValue(todoAtomFamily(2));
 * ```
 */
export function atomFamily<Param, Value>(
  initializeAtom: (param: Param) => PrimitiveAtom<Value>
): AtomFamily<Param, PrimitiveAtom<Value>>;

export function atomFamily<Param, Value>(
  initializeAtom: (param: Param) => Atom<Value>
): AtomFamily<Param, Atom<Value>>;

export function atomFamily<Param, AtomType>(
  initializeAtom: (param: Param) => AtomType
): AtomFamily<Param, AtomType> {
  const cache = new Map<Param, AtomType>();

  const getAtom = (param: Param): AtomType => {
    let atomInstance = cache.get(param);
    if (!atomInstance) {
      atomInstance = initializeAtom(param);
      cache.set(param, atomInstance);
    }
    return atomInstance;
  };

  getAtom.remove = (param: Param) => {
    cache.delete(param);
  };

  return getAtom;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a write-only atom (action)
 *
 * @example
 * ```ts
 * const incrementAtom = atomAction((get, set) => {
 *   const count = get(countAtom);
 *   set(countAtom, count + 1);
 * });
 *
 * const increment = useSetAtom(incrementAtom);
 * increment();
 * ```
 */
export function atomAction<Args extends unknown[]>(
  write: (get: Getter, set: Setter, ...args: Args) => void
): WritableAtom<null, Args, void> {
  return {
    read: () => null,
    write,
  };
}

/**
 * Create an atom that can be reset to its initial value
 *
 * @example
 * ```ts
 * const countAtom = atomWithReset(0);
 *
 * const reset = useResetAtom(countAtom);
 * reset(); // Resets to 0
 * ```
 */
export function atomWithReset<Value>(
  initialValue: Value
): PrimitiveAtom<Value> & { reset: () => void } {
  const baseAtom = atom(initialValue);
  const resetAction = atomAction((get, set) => {
    set(baseAtom as any, initialValue);
  });

  return Object.assign(baseAtom, {
    reset: () => defaultStore.set(resetAction),
  });
}

/**
 * Reset an atom to its initial value
 *
 * @example
 * ```ts
 * const reset = useResetAtom(countAtom);
 * reset();
 * ```
 */
export function useResetAtom(atomInstance: PrimitiveAtom<any>): () => void {
  if ('reset' in atomInstance && typeof atomInstance.reset === 'function') {
    return atomInstance.reset as () => void;
  }
  throw new Error('Atom does not support reset');
}

/**
 * Create an atom with localStorage persistence
 *
 * @example
 * ```ts
 * const themeAtom = atomWithStorage('theme', 'light');
 * ```
 */
export function atomWithStorage<Value>(
  key: string,
  initialValue: Value,
  storage: Storage = typeof window !== 'undefined' ? localStorage : ({} as Storage)
): PrimitiveAtom<Value> {
  // Try to load from storage
  let storedValue = initialValue;
  try {
    const item = storage.getItem(key);
    if (item) {
      storedValue = JSON.parse(item);
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
  }

  const baseAtom = atom(storedValue);
  const valueSignal = signal(storedValue);

  return {
    read: () => valueSignal(),
    write: (get, set, arg) => {
      const nextValue =
        typeof arg === 'function' ? (arg as (prev: Value) => Value)(valueSignal()) : arg;

      valueSignal.set(nextValue);

      // Persist to storage
      try {
        storage.setItem(key, JSON.stringify(nextValue));
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }

      defaultStore.invalidate(baseAtom);
    },
  };
}

/**
 * Freeze an atom (make it read-only)
 *
 * @example
 * ```ts
 * const frozenAtom = freezeAtom(countAtom);
 * // frozenAtom cannot be modified
 * ```
 */
export function freezeAtom<Value>(atomInstance: Atom<Value>): Atom<Value> {
  return {
    read: atomInstance.read,
  };
}

/**
 * Select a property from an atom
 *
 * @example
 * ```ts
 * const userAtom = atom({ name: 'John', age: 30 });
 * const nameAtom = selectAtom(userAtom, (user) => user.name);
 * ```
 */
export function selectAtom<Value, Selected>(
  atomInstance: Atom<Value>,
  selector: (value: Value) => Selected
): Atom<Selected> {
  return atom((get) => selector(get(atomInstance)));
}

/**
 * Focus on a property of an atom (read/write)
 *
 * @example
 * ```ts
 * const userAtom = atom({ name: 'John', age: 30 });
 * const nameAtom = focusAtom(userAtom, (optic) => optic.prop('name'));
 *
 * const [name, setName] = useAtom(nameAtom);
 * setName('Jane'); // Updates only the name property
 * ```
 */
export function focusAtom<Value, Focused>(
  atomInstance: WritableAtom<Value, [SetStateAction<Value>], void>,
  focus: (value: Value) => Focused
): WritableAtom<Focused, [SetStateAction<Focused>], void> {
  return {
    read: (get) => focus(get(atomInstance)),
    write: (get, set, arg) => {
      const current = get(atomInstance);
      const focused = focus(current);
      const nextFocused =
        typeof arg === 'function' ? (arg as (prev: Focused) => Focused)(focused) : arg;

      // This is a simplified version - a real implementation would need lens/optics
      set(atomInstance, { ...current, ...nextFocused } as any);
    },
  };
}

/**
 * Split an atom into read and write atoms
 *
 * @example
 * ```ts
 * const [readAtom, writeAtom] = splitAtom(userAtom);
 * const user = useAtomValue(readAtom);
 * const setUser = useSetAtom(writeAtom);
 * ```
 */
export function splitAtom<Value, Args extends unknown[], Result>(
  atomInstance: WritableAtom<Value, Args, Result>
): [Atom<Value>, WritableAtom<null, Args, Result>] {
  const readAtom: Atom<Value> = {
    read: atomInstance.read,
  };

  const writeAtom: WritableAtom<null, Args, Result> = {
    read: () => null,
    write: atomInstance.write,
  };

  return [readAtom, writeAtom];
}

/**
 * Batch multiple atom updates
 *
 * @example
 * ```ts
 * batchAtoms(() => {
 *   setCount(5);
 *   setName('John');
 *   setAge(30);
 * }); // Only one render
 * ```
 */
export function batchAtoms<T>(fn: () => T): T {
  return batch(fn);
}
