/**
 * Reactive Queries
 * Auto-updating SQL queries that react to database changes
 */
import type { SQLiteDB, Row } from '../db/sqlite-wasm.js';
/**
 * Reactive query options
 */
export interface ReactiveQueryOptions<T> {
    /** SQL query */
    sql: string;
    /** Query parameters */
    params?: unknown[];
    /** Tables this query depends on (auto-detected if not provided) */
    dependencies?: string[];
    /** Transform function for results */
    transform?: (rows: Row[]) => T[];
    /** Debounce time in ms */
    debounce?: number;
}
/**
 * Reactive query state
 */
export interface ReactiveQueryState<T> {
    /** Current data */
    data: T[];
    /** Loading state */
    loading: boolean;
    /** Error if any */
    error: Error | null;
    /** Last updated timestamp */
    updatedAt: number;
}
/**
 * Reactive query instance
 */
export declare class ReactiveQuery<T extends Row = Row> {
    private db;
    private sql;
    private params;
    private dependencies;
    private transform?;
    private debounceMs;
    private state;
    private listeners;
    private unsubscribes;
    private debounceTimer;
    constructor(db: SQLiteDB, options: ReactiveQueryOptions<T>);
    /**
     * Get current data
     */
    get data(): T[];
    /**
     * Get loading state
     */
    get loading(): boolean;
    /**
     * Get error
     */
    get error(): Error | null;
    /**
     * Get last update timestamp
     */
    get updatedAt(): number;
    /**
     * Execute query and update state
     */
    execute(): void;
    /**
     * Manually refresh the query
     */
    refresh(): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: () => void): () => void;
    /**
     * Update query parameters
     */
    setParams(params: unknown[]): void;
    /**
     * Cleanup subscriptions
     */
    dispose(): void;
    /**
     * Subscribe to database changes
     */
    private subscribeToChanges;
    /**
     * Handle table change event
     */
    private handleChange;
    /**
     * Notify all listeners of state change
     */
    private notifyListeners;
    /**
     * Extract table names from SQL
     */
    private extractTables;
}
/**
 * Create a reactive query
 */
export declare function createReactiveQuery<T extends Row = Row>(db: SQLiteDB, options: ReactiveQueryOptions<T>): ReactiveQuery<T>;
/**
 * Reactive query builder for type-safe queries
 */
export declare class QueryBuilder<T extends Row = Row> {
    private db;
    private _select;
    private _from;
    private _where;
    private _orderBy;
    private _limit?;
    private _offset?;
    private _params;
    constructor(db: SQLiteDB);
    select(columns: string | string[]): this;
    from(table: string): this;
    where(condition: string, ...params: unknown[]): this;
    orderBy(column: string, direction?: 'ASC' | 'DESC'): this;
    limit(count: number): this;
    offset(count: number): this;
    /**
     * Build the SQL query
     */
    toSQL(): {
        sql: string;
        params: unknown[];
    };
    /**
     * Execute as a one-time query
     */
    execute(): T[];
    /**
     * Create a reactive version of this query
     */
    reactive(options?: {
        debounce?: number;
    }): ReactiveQuery<T>;
}
/**
 * Create a query builder
 */
export declare function query<T extends Row = Row>(db: SQLiteDB): QueryBuilder<T>;
//# sourceMappingURL=reactive-query.d.ts.map