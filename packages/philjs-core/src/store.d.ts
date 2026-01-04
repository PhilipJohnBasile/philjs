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
export type StoreNode = Record<string | number | symbol, any>;
export type Store<T extends StoreNode> = T;
export type SetStoreFunction<T extends StoreNode> = {
    <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])): void;
    <K extends keyof T, K2 extends keyof T[K]>(key: K, key2: K2, value: T[K][K2] | ((prev: T[K][K2]) => T[K][K2])): void;
    <K extends keyof T, K2 extends keyof T[K], K3 extends keyof T[K][K2]>(key: K, key2: K2, key3: K3, value: T[K][K2][K3] | ((prev: T[K][K2][K3]) => T[K][K2][K3])): void;
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
export type StoreMiddleware<T extends StoreNode> = (state: T, path: (string | number | symbol)[], value: any, prevValue: any) => void;
export interface StoreSnapshot<T> {
    timestamp: number;
    state: T;
    action?: string;
}
/**
 * Create a reactive store with deep reactivity
 */
export declare function createStore<T extends StoreNode>(initialState: T, options?: StoreOptions<T>): [Store<T>, SetStoreFunction<T>];
/**
 * Create a derived store value (like computed for stores)
 */
export declare function derive<T extends StoreNode, R>(store: Store<T>, selector: (state: T) => R): () => R;
/**
 * Create a store with actions
 */
export declare function createStoreWithActions<T extends StoreNode, A extends Record<string, (set: SetStoreFunction<T>, get: () => T, ...args: any[]) => any>>(initialState: T, actions: A, options?: StoreOptions<T>): [Store<T>, SetStoreFunction<T>, {
    [K in keyof A]: (...args: Parameters<A[K]> extends [any, any, ...infer P] ? P : never) => ReturnType<A[K]>;
}];
/**
 * Produce immutable updates (Immer-like)
 */
export declare function produce<T extends StoreNode>(state: T, recipe: (draft: T) => void): T;
/**
 * Reconcile arrays efficiently
 */
export declare function reconcile<T>(oldArray: T[], newArray: T[], keyFn: (item: T) => string | number): T[];
/**
 * Create a store slice
 */
export declare function createSlice<T extends StoreNode, K extends keyof T>(store: Store<T>, setStore: SetStoreFunction<T>, key: K): [Store<T[K]>, SetStoreFunction<T[K]>];
/**
 * Subscribe to store changes (for side effects)
 */
export declare function subscribeToStore<T extends StoreNode>(store: Store<T>, callback: (state: T) => void): () => void;
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
export declare function createUndoableStore<T extends StoreNode>(initialState: T, options?: StoreOptions<T> & {
    historyLimit?: number;
}): UndoRedoStore<T>;
//# sourceMappingURL=store.d.ts.map