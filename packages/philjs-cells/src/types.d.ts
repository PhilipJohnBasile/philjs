/**
 * PhilJS Cells - Type Definitions
 *
 * RedwoodJS-style Cells pattern for declarative data loading.
 */
import type { VNode, JSXElement } from 'philjs-core';
import type { Signal, Memo } from 'philjs-core';
/**
 * Fetcher function that can return data directly or via Promise
 */
export type CellFetcher<TData, TVariables = Record<string, unknown>> = (variables: TVariables) => Promise<TData> | TData;
/**
 * GraphQL query string for cells that use GraphQL
 */
export type CellQuery = string;
/**
 * Props passed to the Loading component
 */
export interface LoadingProps {
    /** Number of times the cell has attempted to load */
    attempts: number;
}
/**
 * Props passed to the Empty component
 */
export interface EmptyProps {
    /** Variables that were passed to the fetcher */
    variables: Record<string, unknown>;
}
/**
 * Props passed to the Failure component
 */
export interface FailureProps {
    /** The error that occurred */
    error: Error;
    /** Number of retry attempts */
    retryCount: number;
    /** Function to retry the fetch */
    retry: () => void;
    /** Whether a retry is in progress */
    isRetrying: boolean;
}
/**
 * Props passed to the Success component
 */
export type SuccessProps<TData> = TData & {
    /** Function to manually refetch data */
    refetch: () => Promise<void>;
    /** Signal indicating if refetch is in progress */
    isRefetching: boolean;
};
/**
 * State components for a Cell
 */
export interface CellStateComponents<TData> {
    /** Component shown while loading */
    Loading?: (props: LoadingProps) => VNode;
    /** Component shown when data is empty */
    Empty?: (props: EmptyProps) => VNode;
    /** Component shown when an error occurs */
    Failure?: (props: FailureProps) => VNode;
    /** Component shown when data is successfully loaded */
    Success: (props: SuccessProps<TData>) => VNode;
}
/**
 * Cell definition configuration
 */
export interface CellDefinition<TData, TVariables = Record<string, unknown>> {
    /** GraphQL query (mutually exclusive with fetch) */
    QUERY?: CellQuery;
    /** Fetch function (mutually exclusive with QUERY) */
    fetch?: CellFetcher<TData, TVariables>;
    /** Transform data after fetching */
    afterQuery?: (data: TData) => TData;
    /** Check if data should be considered empty */
    isEmpty?: (data: TData) => boolean;
    /** Loading component */
    Loading?: (props: LoadingProps) => VNode;
    /** Empty state component */
    Empty?: (props: EmptyProps) => VNode;
    /** Error/failure component */
    Failure?: (props: FailureProps) => VNode;
    /** Success component - receives the fetched data */
    Success: (props: SuccessProps<TData>) => VNode;
    /** Display name for debugging */
    displayName?: string;
}
/**
 * Props that can be passed to a Cell component
 */
export interface CellProps<TVariables = Record<string, unknown>> {
    /** Variables to pass to the fetcher */
    variables?: TVariables;
    /** Override the default cache key */
    cacheKey?: string;
    /** Disable caching for this instance */
    noCache?: boolean;
    /** Polling interval in milliseconds */
    pollInterval?: number;
    /** Callback when data is successfully loaded */
    onSuccess?: (data: unknown) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
}
/**
 * The Cell component type returned by createCell
 */
export type CellComponent<TData, TVariables = Record<string, unknown>> = {
    (props: TVariables & CellProps<TVariables>): JSXElement;
    /** Display name for debugging */
    displayName: string;
    /** Original cell definition */
    __cellDefinition: CellDefinition<TData, TVariables>;
};
/**
 * Internal cell state
 */
export interface CellState<TData> {
    /** Current status of the cell */
    status: 'loading' | 'success' | 'error' | 'empty';
    /** The fetched data (if successful) */
    data: TData | null;
    /** The error (if failed) */
    error: Error | null;
    /** Number of fetch attempts */
    attempts: number;
    /** Whether a refetch is in progress */
    isRefetching: boolean;
    /** Timestamp of last successful fetch */
    lastFetchedAt: number | null;
}
/**
 * Reactive cell state using signals
 */
export interface ReactiveCellState<TData> {
    status: Signal<CellState<TData>['status']>;
    data: Signal<TData | null>;
    error: Signal<Error | null>;
    attempts: Signal<number>;
    isRefetching: Signal<boolean>;
    isLoading: Memo<boolean>;
    isSuccess: Memo<boolean>;
    isError: Memo<boolean>;
    isEmpty: Memo<boolean>;
}
/**
 * Configuration for CellProvider
 */
export interface CellProviderConfig {
    /** GraphQL client for QUERY-based cells */
    graphqlClient?: {
        query: (query: string, variables?: Record<string, unknown>) => Promise<unknown>;
    };
    /** Global fetch function override */
    fetch?: typeof globalThis.fetch;
    /** Default cache TTL in milliseconds */
    defaultCacheTTL?: number;
    /** Default retry configuration */
    retry?: {
        maxRetries?: number;
        retryDelay?: number;
        backoffMultiplier?: number;
    };
    /** SSR streaming support */
    streaming?: {
        enabled?: boolean;
        /** Placeholder shown during streaming */
        fallback?: () => VNode;
    };
    /** Global error handler */
    onError?: (error: Error, cellName: string) => void;
    /** Global success handler */
    onSuccess?: (data: unknown, cellName: string) => void;
}
/**
 * Context value for CellProvider
 */
export interface CellContextValue extends CellProviderConfig {
    /** Execute a GraphQL query */
    executeQuery: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
    /** Execute a fetch request */
    executeFetch: <T>(fetcher: CellFetcher<T, Record<string, unknown>>, variables: Record<string, unknown>) => Promise<T>;
    /** Get cached data for a cell */
    getCached: <T>(key: string) => T | null;
    /** Set cached data for a cell */
    setCached: <T>(key: string, data: T, ttl?: number) => void;
    /** Invalidate cached data */
    invalidate: (key: string | RegExp) => void;
}
/**
 * Cache entry for a cell
 */
export interface CellCacheEntry<TData> {
    /** The cached data */
    data: TData;
    /** Timestamp when cached */
    cachedAt: number;
    /** Time-to-live in milliseconds */
    ttl: number;
    /** Whether the entry is currently being revalidated */
    isRevalidating: boolean;
}
/**
 * Cell cache interface
 */
export interface CellCache {
    /** Get a cached entry */
    get: <T>(key: string) => CellCacheEntry<T> | null;
    /** Set a cached entry */
    set: <T>(key: string, data: T, ttl?: number) => void;
    /** Delete a cached entry */
    delete: (key: string) => boolean;
    /** Clear all cache or entries matching a pattern */
    clear: (pattern?: string | RegExp) => void;
    /** Check if an entry is stale */
    isStale: (key: string) => boolean;
    /** Subscribe to cache changes */
    subscribe: (key: string, callback: (data: unknown) => void) => () => void;
    /** Get all cache keys */
    keys: () => string[];
    /** Get cache size */
    size: () => number;
}
/**
 * SSR context for cells
 */
export interface CellSSRContext {
    /** Map of cell data for hydration */
    cellData: Map<string, unknown>;
    /** Pending cell promises */
    pendingCells: Map<string, Promise<unknown>>;
    /** Mark a cell as hydrated */
    markHydrated: (key: string) => void;
    /** Check if a cell has been hydrated */
    isHydrated: (key: string) => boolean;
    /** Serialize cell data for client */
    serialize: () => string;
    /** Deserialize cell data on client */
    deserialize: (data: string) => void;
}
/**
 * Extract the data type from a Cell component
 */
export type CellDataType<T> = T extends CellComponent<infer TData, unknown> ? TData : never;
/**
 * Extract the variables type from a Cell component
 */
export type CellVariablesType<T> = T extends CellComponent<unknown, infer TVariables> ? TVariables : never;
/**
 * Make all properties in T optional except for specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;
/**
 * GraphQL operation result type
 */
export interface GraphQLResult<TData> {
    data?: TData;
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: string[];
        extensions?: Record<string, unknown>;
    }>;
}
/**
 * Default empty check function type
 */
export type EmptyCheckFn<TData> = (data: TData) => boolean;
/**
 * Built-in empty checkers
 */
export declare const defaultIsEmpty: <T>(data: T) => boolean;
//# sourceMappingURL=types.d.ts.map