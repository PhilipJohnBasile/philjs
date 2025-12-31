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
import { signal, batch } from 'philjs-core';
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
export function createStore(createState) {
    // Create the signal that holds the state
    const stateSignal = signal({});
    const listeners = new Set();
    const api = {
        setState: (partial, replace = false) => {
            const prevState = stateSignal();
            batch(() => {
                if (typeof partial === 'function') {
                    const newState = partial(prevState);
                    if (replace) {
                        stateSignal.set(newState);
                    }
                    else {
                        stateSignal.set({ ...prevState, ...newState });
                    }
                }
                else {
                    if (replace) {
                        stateSignal.set(partial);
                    }
                    else {
                        stateSignal.set({ ...prevState, ...partial });
                    }
                }
            });
            const newState = stateSignal();
            // Notify listeners
            listeners.forEach(listener => {
                try {
                    listener(newState, prevState);
                }
                catch (error) {
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
    const useStore = ((selector, equals) => {
        if (!selector) {
            // Return full state
            return stateSignal();
        }
        // Memoized selector
        const selected = selector(stateSignal());
        // Track this as a reactive dependency
        return selected;
    });
    // Attach API methods
    useStore.setState = api.setState;
    useStore.getState = api.getState;
    useStore.subscribe = api.subscribe;
    useStore.destroy = api.destroy;
    return useStore;
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
export function persist(config, options) {
    return (set, get, api) => {
        const { name, storage = typeof window !== 'undefined' ? localStorage : undefined, serialize = JSON.stringify, deserialize = JSON.parse, partialize = (state) => state, onRehydrateStorage, version = 0, migrate, } = options;
        // Load persisted state
        let persistedState = {};
        if (storage) {
            try {
                const item = storage.getItem(name);
                if (item) {
                    const parsed = deserialize(item);
                    // Handle version migration
                    if (migrate && parsed._version !== version) {
                        persistedState = migrate(parsed, parsed._version || 0);
                    }
                    else {
                        persistedState = parsed;
                    }
                    if (onRehydrateStorage) {
                        const cb = onRehydrateStorage(persistedState);
                        if (cb) {
                            try {
                                cb(persistedState);
                            }
                            catch (error) {
                                cb(undefined, error);
                            }
                        }
                    }
                }
            }
            catch (error) {
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
                    });
                    storage.setItem(name, serialized);
                }
                catch (error) {
                    console.error('Failed to persist state:', error);
                }
            }
        };
        return hydratedState;
    };
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
export function devtools(config, options = {}) {
    return (set, get, api) => {
        const { name = 'PhilJS Store', enabled = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__, anonymousActionType = 'anonymous', } = options;
        let extension;
        if (enabled && typeof window !== 'undefined') {
            const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
            if (devTools) {
                extension = devTools.connect({ name });
            }
        }
        const initialState = config(set, get, api);
        if (extension) {
            extension.init(initialState);
            // Wrap setState to send actions to devtools
            const originalSet = api.setState;
            api.setState = (partial, replace, actionName) => {
                originalSet(partial, replace);
                const actionType = actionName || anonymousActionType;
                const state = get();
                extension.send({ type: actionType, payload: partial }, state);
            };
            // Subscribe to devtools actions (time travel, etc.)
            extension.subscribe((message) => {
                if (message.type === 'DISPATCH' && message.state) {
                    try {
                        const newState = JSON.parse(message.state);
                        api.setState(newState, true);
                    }
                    catch (error) {
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
export function immer(config) {
    return (set, get, api) => {
        const immerSet = (partial, replace) => {
            if (typeof partial === 'function') {
                // Create a draft-like proxy
                set((state) => {
                    const draft = createDraft(state);
                    const result = partial(draft);
                    // If function returns a value, use it; otherwise use the mutated draft
                    return result !== undefined ? result : draft;
                }, replace);
            }
            else {
                set(partial, replace);
            }
        };
        return config(immerSet, get, api);
    };
}
/**
 * Simple draft proxy (not a full Immer implementation)
 */
function createDraft(state) {
    if (typeof state !== 'object' || state === null) {
        return state;
    }
    if (Array.isArray(state)) {
        return [...state];
    }
    return { ...state };
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Shallow equality comparison for selectors
 */
export function shallow(a, b) {
    if (Object.is(a, b))
        return true;
    if (typeof a !== 'object' ||
        a === null ||
        typeof b !== 'object' ||
        b === null) {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key) ||
            !Object.is(a[key], b[key])) {
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
export function combine(stores) {
    const useStore = createStore((set, get) => {
        const initialState = {};
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
export function createSlice(slice) {
    return slice;
}
//# sourceMappingURL=index.js.map