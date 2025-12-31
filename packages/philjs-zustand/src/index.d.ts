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
export type StateCreator<T> = (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T;
export type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
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
export type Middleware<T> = (config: StateCreator<T>) => StateCreator<T>;
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
export declare function createStore<T extends object>(createState: StateCreator<T>): UseStore<T>;
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
export declare function persist<T extends object>(config: StateCreator<T>, options: PersistOptions<T>): StateCreator<T>;
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
export declare function devtools<T extends object>(config: StateCreator<T>, options?: DevToolsOptions): StateCreator<T>;
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
export declare function immer<T extends object>(config: StateCreator<T>): StateCreator<T>;
/**
 * Shallow equality comparison for selectors
 */
export declare function shallow<T>(a: T, b: T): boolean;
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
export declare function combine<T extends Record<string, UseStore<any>>>(stores: T): UseStore<{
    [K in keyof T]: ReturnType<T[K]>;
}>;
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
export declare function createSlice<T extends object>(slice: StateCreator<T>): StateCreator<T>;
//# sourceMappingURL=index.d.ts.map