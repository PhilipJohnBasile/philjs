/**
 * PhilJS Rocket State Management
 *
 * State management integration for Rocket framework.
 * Provides typed state containers and reactive state updates.
 */
/**
 * Managed state container
 */
export interface ManagedState<T> {
    /** Get current state value */
    get(): T;
    /** Get a reference to state (for reading) */
    inner(): T;
    /** Update state with a function */
    update(fn: (state: T) => T): void;
    /** Replace state entirely */
    set(value: T): void;
    /** Subscribe to state changes */
    subscribe(listener: (state: T) => void): () => void;
}
/**
 * State configuration
 */
export interface StateConfig<T> {
    /** Initial state value */
    initial: T;
    /** State key for persistence */
    key?: string;
    /** Enable persistence */
    persist?: boolean;
    /** Custom serializer */
    serialize?: (state: T) => string;
    /** Custom deserializer */
    deserialize?: (data: string) => T;
}
/**
 * State manager for the application
 */
export interface StateManager {
    /** Register managed state */
    manage<T>(key: string, value: T): ManagedState<T>;
    /** Get managed state by key */
    get<T>(key: string): ManagedState<T> | undefined;
    /** Check if state exists */
    has(key: string): boolean;
    /** Remove managed state */
    remove(key: string): boolean;
    /** Get all state keys */
    keys(): string[];
    /** Clear all state */
    clear(): void;
}
/**
 * Create a managed state container
 */
export declare function createManagedState<T>(config: StateConfig<T>): ManagedState<T>;
/**
 * Create a state manager
 */
export declare function createStateManager(): StateManager;
/**
 * Request-local state container
 */
export interface RequestState<T = Record<string, unknown>> {
    /** Get a value from request state */
    get<V>(key: string): V | undefined;
    /** Set a value in request state */
    set<V>(key: string, value: V): void;
    /** Check if a key exists */
    has(key: string): boolean;
    /** Delete a key */
    delete(key: string): boolean;
    /** Get all state as an object */
    all(): T;
}
/**
 * Create request-local state
 */
export declare function createRequestState<T extends Record<string, unknown> = Record<string, unknown>>(initial?: Partial<T>): RequestState<T>;
/**
 * Application state definition
 */
export interface AppState<T> {
    /** Current state */
    state: T;
    /** State version for optimistic concurrency */
    version: number;
    /** Last update timestamp */
    updatedAt: number;
}
/**
 * Global state container
 */
export declare class GlobalState<T> {
    private _state;
    private _version;
    private _updatedAt;
    private _listeners;
    constructor(initial: T);
    /**
     * Get current state
     */
    get state(): T;
    /**
     * Get state version
     */
    get version(): number;
    /**
     * Get last update timestamp
     */
    get updatedAt(): number;
    /**
     * Update state
     */
    update(fn: (state: T) => T): void;
    /**
     * Set state with expected version (optimistic concurrency)
     */
    setWithVersion(value: T, expectedVersion: number): boolean;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: T, version: number) => void): () => void;
    /**
     * Get state snapshot
     */
    snapshot(): AppState<T>;
    private notify;
}
/**
 * Create a global state container
 */
export declare function createGlobalState<T>(initial: T): GlobalState<T>;
/**
 * Selector function type
 */
export type Selector<T, R> = (state: T) => R;
/**
 * Create a memoized selector
 */
export declare function createSelector<T, R>(selector: Selector<T, R>, equalityFn?: (a: R, b: R) => boolean): Selector<T, R>;
/**
 * Create a derived selector from multiple selectors
 */
export declare function createDerivedSelector<T, S1, R>(selector1: Selector<T, S1>, combiner: (s1: S1) => R): Selector<T, R>;
export declare function createDerivedSelector<T, S1, S2, R>(selector1: Selector<T, S1>, selector2: Selector<T, S2>, combiner: (s1: S1, s2: S2) => R): Selector<T, R>;
export declare function createDerivedSelector<T, S1, S2, S3, R>(selector1: Selector<T, S1>, selector2: Selector<T, S2>, selector3: Selector<T, S3>, combiner: (s1: S1, s2: S2, s3: S3) => R): Selector<T, R>;
/**
 * Generate Rust state code
 */
export declare function generateRustState(name: string, fields: Record<string, string>): string;
/**
 * Generate Rust request guard for state
 */
export declare function generateRustStateGuard(name: string): string;
//# sourceMappingURL=state.d.ts.map