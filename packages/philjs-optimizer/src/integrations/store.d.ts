/**
 * Store lazy loading integration
 */
/**
 * Lazy store
 */
export interface LazyStore<T = any> {
    symbolId: string;
    store?: T;
    loaded: boolean;
    initialState?: T;
}
/**
 * Create a lazy store
 */
export declare function lazyStore<T = any>(loader: () => Promise<T>, initialState?: T): LazyStore<T>;
/**
 * Load a lazy store
 */
export declare function loadStore<T = any>(lazyStore: LazyStore<T>): Promise<T>;
/**
 * Use a lazy store (hook-like API)
 */
export declare function useLazyStore<T = any>(lazyStore: LazyStore<T>): T | undefined;
/**
 * Store registry
 */
export declare class StoreRegistry {
    private stores;
    register<T = any>(store: LazyStore<T>): void;
    get(symbolId: string): LazyStore | undefined;
    loadAll(): Promise<void>;
    getLoadedCount(): number;
    getTotalCount(): number;
}
/**
 * Global store registry
 */
export declare const storeRegistry: StoreRegistry;
//# sourceMappingURL=store.d.ts.map