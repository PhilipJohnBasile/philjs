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
import { signal, memo, resource, batch } from 'philjs-core';
class Store {
    atomStates = new WeakMap();
    dependencyMap = new WeakMap();
    get(atom) {
        const atomState = this.getAtomState(atom);
        return atomState.signal();
    }
    set(atom, ...args) {
        if (!('write' in atom)) {
            throw new Error('Atom is not writable');
        }
        return atom.write((a) => this.get(a), (a, ...args) => this.set(a, ...args), ...args);
    }
    subscribe(atom, callback) {
        const atomState = this.getAtomState(atom);
        return atomState.signal.subscribe(callback);
    }
    getAtomState(atom) {
        let atomState = this.atomStates.get(atom);
        if (!atomState) {
            // Create initial state
            const dependencies = new Set();
            const getter = (a) => {
                dependencies.add(a);
                return this.get(a);
            };
            const value = atom.read(getter);
            const sig = signal(value);
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
    invalidate(atom) {
        const atomState = this.atomStates.get(atom);
        if (!atomState)
            return;
        // Re-compute value
        const getter = (a) => this.get(a);
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
export function atom(read, write) {
    if (typeof read === 'function') {
        // Derived atom
        const readFn = read;
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
    }
    else {
        // Primitive atom
        const initialValue = read;
        const valueSignal = signal(initialValue);
        const primitiveAtom = {
            read: () => valueSignal(),
            write: (get, set, arg) => {
                const nextValue = typeof arg === 'function' ? arg(valueSignal()) : arg;
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
export function useAtomValue(atomInstance) {
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
export function useSetAtom(atomInstance) {
    return (...args) => defaultStore.set(atomInstance, ...args);
}
/**
 * Read and write atom
 *
 * @example
 * ```ts
 * const [count, setCount] = useAtom(countAtom);
 * ```
 */
export function useAtom(atomInstance) {
    const value = useAtomValue(atomInstance);
    const setter = useSetAtom(atomInstance);
    return [value, setter];
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
export function asyncAtom(read) {
    const loading = signal(true);
    const error = signal(null);
    const data = signal(undefined);
    const asyncAtomInstance = {
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
            if (error())
                throw error();
            return data();
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
export function loadable(asyncAtomInstance) {
    return atom((get) => {
        try {
            const value = get(asyncAtomInstance);
            return { state: 'hasData', data: value };
        }
        catch (error) {
            if (error instanceof Promise) {
                return { state: 'loading' };
            }
            return {
                state: 'hasError',
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    });
}
export function atomFamily(initializeAtom) {
    const cache = new Map();
    const getAtom = (param) => {
        let atomInstance = cache.get(param);
        if (!atomInstance) {
            atomInstance = initializeAtom(param);
            cache.set(param, atomInstance);
        }
        return atomInstance;
    };
    getAtom.remove = (param) => {
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
export function atomAction(write) {
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
export function atomWithReset(initialValue) {
    const baseAtom = atom(initialValue);
    const resetAction = atomAction((get, set) => {
        set(baseAtom, initialValue);
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
export function useResetAtom(atomInstance) {
    if ('reset' in atomInstance && typeof atomInstance.reset === 'function') {
        return atomInstance.reset;
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
export function atomWithStorage(key, initialValue, storage = typeof window !== 'undefined' ? localStorage : {}) {
    // Try to load from storage
    let storedValue = initialValue;
    try {
        const item = storage.getItem(key);
        if (item) {
            storedValue = JSON.parse(item);
        }
    }
    catch (error) {
        console.error('Failed to load from storage:', error);
    }
    const baseAtom = atom(storedValue);
    const valueSignal = signal(storedValue);
    return {
        read: () => valueSignal(),
        write: (get, set, arg) => {
            const nextValue = typeof arg === 'function' ? arg(valueSignal()) : arg;
            valueSignal.set(nextValue);
            // Persist to storage
            try {
                storage.setItem(key, JSON.stringify(nextValue));
            }
            catch (error) {
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
export function freezeAtom(atomInstance) {
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
export function selectAtom(atomInstance, selector) {
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
export function focusAtom(atomInstance, focus) {
    return {
        read: (get) => focus(get(atomInstance)),
        write: (get, set, arg) => {
            const current = get(atomInstance);
            const focused = focus(current);
            const nextFocused = typeof arg === 'function' ? arg(focused) : arg;
            // This is a simplified version - a real implementation would need lens/optics
            set(atomInstance, { ...current, ...nextFocused });
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
export function splitAtom(atomInstance) {
    const readAtom = {
        read: atomInstance.read,
    };
    const writeAtom = {
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
export function batchAtoms(fn) {
    return batch(fn);
}
//# sourceMappingURL=index.js.map